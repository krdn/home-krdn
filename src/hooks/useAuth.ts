'use client';

/**
 * useAuth 훅
 *
 * 현재 사용자 세션 정보와 역할 기반 권한 검사를 제공합니다.
 * RBAC 시스템과 통합되어 프론트엔드에서 역할 기반 UI 분기에 사용됩니다.
 *
 * Phase 19: RBAC Access Control
 *
 * @example
 * ```tsx
 * const { user, role, isAdmin, hasPermission } = useAuth();
 *
 * // 역할 확인
 * if (isAdmin) {
 *   // admin 전용 UI
 * }
 *
 * // 권한 확인
 * if (hasPermission('docker', 'write')) {
 *   // 컨테이너 제어 버튼 표시
 * }
 * ```
 */

import { useQuery } from '@tanstack/react-query';
import { hasPermission as checkPermission } from '@/lib/rbac';
import type { User, UserRole, Resource, Action } from '@/types/auth';

/**
 * useAuth 훅 반환 타입
 */
export interface UseAuthReturn {
  /** 현재 로그인한 사용자 정보 */
  user: User | null;
  /** 사용자 역할 (lowercase) */
  role: UserRole | null;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 */
  error: Error | null;
  /** 권한 확인 함수 */
  hasPermission: (resource: Resource, action: Action) => boolean;
  /** Admin 역할 여부 */
  isAdmin: boolean;
  /** User 역할 여부 (admin 포함) */
  isUser: boolean;
  /** Viewer 역할 여부 (모든 역할 포함) */
  isViewer: boolean;
  /** 로그인 상태 */
  isAuthenticated: boolean;
  /** 세션 새로고침 */
  refetch: () => void;
}

/**
 * 세션 API 응답 타입
 */
interface SessionResponse {
  success: boolean;
  user?: User;
  authenticated: boolean;
}

/**
 * 세션 정보를 가져오는 fetch 함수
 */
async function fetchSession(): Promise<SessionResponse> {
  const response = await fetch('/api/auth/session', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    // 401 등 인증 오류는 미인증 상태로 처리
    if (response.status === 401) {
      return { success: false, authenticated: false };
    }
    throw new Error('세션 정보를 가져오는데 실패했습니다');
  }

  return response.json();
}

/**
 * 인증 및 권한 관리 훅
 *
 * 세션 정보를 관리하고 역할 기반 권한 검사 메서드를 제공합니다.
 * React Query를 사용하여 캐싱과 자동 재검증을 지원합니다.
 */
export function useAuth(): UseAuthReturn {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000, // 5분
    retry: false, // 인증 실패 시 재시도하지 않음
  });

  const user = data?.user ?? null;
  const role = user?.role ?? null;
  const isAuthenticated = data?.authenticated ?? false;

  /**
   * 특정 리소스에 대한 특정 액션 권한 확인
   */
  const hasPermission = (resource: Resource, action: Action): boolean => {
    if (!role) return false;
    return checkPermission(role, resource, action);
  };

  // 역할 계층: admin > user > viewer
  const isAdmin = role === 'admin';
  const isUser = role === 'admin' || role === 'user';
  const isViewer = role === 'admin' || role === 'user' || role === 'viewer';

  return {
    user,
    role,
    isLoading,
    error: error as Error | null,
    hasPermission,
    isAdmin,
    isUser,
    isViewer,
    isAuthenticated,
    refetch,
  };
}

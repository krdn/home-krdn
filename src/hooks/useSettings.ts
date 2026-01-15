'use client';

/**
 * useSettings 훅
 *
 * 사용자 대시보드 설정(테마, 알림)을 서버에서 가져오고 업데이트합니다.
 * React Query를 사용하여 캐싱과 자동 재검증을 지원합니다.
 *
 * Phase 20: User Dashboard Settings
 *
 * @example
 * ```tsx
 * const { settings, updateSettings, isLoading, isUpdating } = useSettings();
 *
 * // 테마 변경
 * updateSettings({ theme: 'dark' });
 *
 * // 알림 설정 변경
 * updateSettings({ emailNotifications: true, pushNotifications: false });
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * UserSettings DTO 타입 (서버 응답과 동일)
 */
export interface UserSettingsDto {
  id: string;
  dashboardLayout: string | null;
  theme: 'dark' | 'light';
  emailNotifications: boolean;
  pushNotifications: boolean;
}

/**
 * 설정 업데이트 입력 타입
 */
export interface UpdateSettingsInput {
  theme?: 'dark' | 'light';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  dashboardLayout?: string;
}

/**
 * API 응답 타입
 */
interface SettingsResponse {
  success: boolean;
  data?: UserSettingsDto;
  error?: string;
  code?: string;
}

/**
 * useSettings 훅 반환 타입
 */
export interface UseSettingsReturn {
  /** 현재 설정 */
  settings: UserSettingsDto | null;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 */
  error: Error | null;
  /** 설정 업데이트 함수 */
  updateSettings: (data: UpdateSettingsInput) => void;
  /** 업데이트 중 상태 */
  isUpdating: boolean;
  /** 업데이트 에러 */
  updateError: Error | null;
  /** 설정 새로고침 */
  refetch: () => void;
}

/**
 * 설정을 가져오는 fetch 함수
 */
async function fetchSettings(): Promise<SettingsResponse> {
  const response = await fetch('/api/settings', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      // 미인증 상태 - 에러를 던지지 않고 빈 응답 반환
      return { success: false };
    }
    throw new Error('설정을 가져오는데 실패했습니다');
  }

  return response.json();
}

/**
 * 설정을 업데이트하는 fetch 함수
 */
async function updateSettingsApi(
  data: UpdateSettingsInput
): Promise<SettingsResponse> {
  const response = await fetch('/api/settings', {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '설정 업데이트에 실패했습니다');
  }

  return response.json();
}

/**
 * 사용자 설정 관리 훅
 *
 * 서버에서 설정을 가져오고 업데이트합니다.
 * React Query를 사용하여 캐싱(5분)과 자동 재검증을 지원합니다.
 */
export function useSettings(): UseSettingsReturn {
  const queryClient = useQueryClient();

  // 설정 조회
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000, // 5분
    retry: false,
  });

  // 설정 업데이트 mutation
  const mutation = useMutation({
    mutationFn: updateSettingsApi,
    onSuccess: (response) => {
      // 캐시 업데이트
      if (response.success && response.data) {
        queryClient.setQueryData(['settings'], response);
      }
    },
  });

  const settings = data?.success && data.data ? data.data : null;

  return {
    settings,
    isLoading,
    error: error as Error | null,
    updateSettings: mutation.mutate,
    isUpdating: mutation.isPending,
    updateError: mutation.error as Error | null,
    refetch,
  };
}

'use client';

/**
 * RoleGuard 컴포넌트
 *
 * 역할 기반 조건부 렌더링 컴포넌트입니다.
 * 현재 사용자의 역할이 허용된 역할 목록에 포함되면 children을 렌더링합니다.
 *
 * Phase 19: RBAC Access Control
 *
 * @example
 * ```tsx
 * // 역할 기반 렌더링
 * <RoleGuard allowedRoles={['admin', 'user']}>
 *   <DeleteButton />
 * </RoleGuard>
 *
 * // 권한 기반 렌더링
 * <RoleGuard requiredPermission={{ resource: 'docker', action: 'write' }}>
 *   <ContainerControlPanel />
 * </RoleGuard>
 *
 * // fallback 사용
 * <RoleGuard allowedRoles={['admin']} fallback={<p>권한 없음</p>}>
 *   <AdminPanel />
 * </RoleGuard>
 * ```
 */

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole, Resource, Action } from '@/types/auth';

/**
 * 권한 요구사항 타입
 */
interface PermissionRequirement {
  resource: Resource;
  action: Action;
}

/**
 * RoleGuard Props
 */
export interface RoleGuardProps {
  /** 허용된 역할 목록 */
  allowedRoles?: UserRole[];
  /** 필요한 권한 (리소스 + 액션) */
  requiredPermission?: PermissionRequirement;
  /** 권한이 없을 때 렌더링할 대체 컴포넌트 */
  fallback?: ReactNode;
  /** 보호할 컨텐츠 */
  children: ReactNode;
}

/**
 * 역할 기반 조건부 렌더링 컴포넌트
 *
 * allowedRoles 또는 requiredPermission 중 하나 이상을 지정해야 합니다.
 * 둘 다 지정된 경우, 두 조건을 모두 만족해야 렌더링됩니다.
 */
export function RoleGuard({
  allowedRoles,
  requiredPermission,
  fallback = null,
  children,
}: RoleGuardProps): ReactNode {
  const { role, hasPermission, isLoading, isAuthenticated } = useAuth();

  // 로딩 중에는 fallback 표시
  if (isLoading) {
    return fallback;
  }

  // 인증되지 않은 경우 fallback 표시
  if (!isAuthenticated || !role) {
    return fallback;
  }

  // 역할 검사 (지정된 경우)
  if (allowedRoles && !allowedRoles.includes(role)) {
    return fallback;
  }

  // 권한 검사 (지정된 경우)
  if (
    requiredPermission &&
    !hasPermission(requiredPermission.resource, requiredPermission.action)
  ) {
    return fallback;
  }

  // 모든 검사 통과, children 렌더링
  return children;
}

/**
 * Admin 전용 래퍼 컴포넌트
 *
 * @example
 * <AdminOnly>
 *   <SystemSettings />
 * </AdminOnly>
 */
export function AdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}): ReactNode {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * User 이상 역할 래퍼 컴포넌트
 *
 * @example
 * <UserOnly>
 *   <EditButton />
 * </UserOnly>
 */
export function UserOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}): ReactNode {
  return (
    <RoleGuard allowedRoles={['admin', 'user']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * 권한 기반 렌더링 래퍼 컴포넌트
 *
 * @example
 * <PermissionGuard resource="docker" action="write">
 *   <ContainerControls />
 * </PermissionGuard>
 */
export function PermissionGuard({
  resource,
  action,
  children,
  fallback = null,
}: {
  resource: Resource;
  action: Action;
  children: ReactNode;
  fallback?: ReactNode;
}): ReactNode {
  return (
    <RoleGuard
      requiredPermission={{ resource, action }}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

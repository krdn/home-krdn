/**
 * RBAC (Role-Based Access Control) 라이브러리
 *
 * 역할 기반 접근 제어를 위한 권한 매트릭스 및 헬퍼 함수
 *
 * Phase 19: RBAC Access Control
 * - 권한 매트릭스 정의
 * - 헬퍼 함수 구현
 * - Edge Runtime 호환 (순수 TypeScript)
 */

import type {
  UserRole,
  Resource,
  Action,
  Permission,
  RolePermissions,
} from "@/types/auth";

// ============================================================
// 권한 매트릭스 상수
// ============================================================

/**
 * 역할별 권한 매트릭스
 *
 * ADMIN: 모든 리소스에 대한 모든 권한
 * USER: system(read), docker(read, write), projects(read, write)
 * VIEWER: system(read), docker(read), projects(read)
 */
export const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    { resource: "system", actions: ["read", "write", "delete", "manage"] },
    { resource: "docker", actions: ["read", "write", "delete", "manage"] },
    { resource: "projects", actions: ["read", "write", "delete", "manage"] },
    { resource: "users", actions: ["read", "write", "delete", "manage"] },
    { resource: "admin", actions: ["read", "write", "delete", "manage"] },
  ],
  user: [
    { resource: "system", actions: ["read"] },
    { resource: "docker", actions: ["read", "write"] },
    { resource: "projects", actions: ["read", "write"] },
  ],
  viewer: [
    { resource: "system", actions: ["read"] },
    { resource: "docker", actions: ["read"] },
    { resource: "projects", actions: ["read"] },
  ],
};

// ============================================================
// 경로 → 리소스 매핑
// ============================================================

/**
 * HTTP 메서드 → 액션 매핑
 */
const METHOD_TO_ACTION: Record<string, Action> = {
  GET: "read",
  HEAD: "read",
  OPTIONS: "read",
  POST: "write",
  PUT: "write",
  PATCH: "write",
  DELETE: "delete",
};

/**
 * 경로 패턴 → 리소스 매핑
 * 순서대로 매칭하며, 가장 먼저 매칭되는 패턴을 사용
 */
const ROUTE_TO_RESOURCE: { pattern: RegExp; resource: Resource }[] = [
  { pattern: /^\/api\/admin\//, resource: "admin" },
  { pattern: /^\/admin\//, resource: "admin" },
  { pattern: /^\/api\/system\//, resource: "system" },
  { pattern: /^\/api\/docker\//, resource: "docker" },
  { pattern: /^\/api\/projects\//, resource: "projects" },
  { pattern: /^\/api\/users\//, resource: "users" },
];

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * 특정 역할이 특정 리소스에 대해 특정 액션 권한이 있는지 확인
 *
 * @param role - 사용자 역할 (lowercase)
 * @param resource - 대상 리소스
 * @param action - 수행할 액션
 * @returns 권한 여부
 *
 * @example
 * hasPermission('user', 'docker', 'write') // true
 * hasPermission('viewer', 'docker', 'write') // false
 */
export function hasPermission(
  role: UserRole,
  resource: Resource,
  action: Action
): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) {
    return false;
  }

  const resourcePermission = permissions.find((p) => p.resource === resource);
  if (!resourcePermission) {
    return false;
  }

  return resourcePermission.actions.includes(action);
}

/**
 * 특정 역할이 특정 리소스에 대해 가진 모든 액션 목록 반환
 *
 * @param role - 사용자 역할 (lowercase)
 * @param resource - 대상 리소스
 * @returns 허용된 액션 목록
 *
 * @example
 * getAllowedActions('user', 'docker') // ['read', 'write']
 * getAllowedActions('viewer', 'docker') // ['read']
 */
export function getAllowedActions(role: UserRole, resource: Resource): Action[] {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) {
    return [];
  }

  const resourcePermission = permissions.find((p) => p.resource === resource);
  if (!resourcePermission) {
    return [];
  }

  return resourcePermission.actions;
}

/**
 * 경로에서 리소스를 추출
 *
 * @param pathname - 요청 경로
 * @returns 매핑된 리소스 또는 null
 */
export function getResourceFromPath(pathname: string): Resource | null {
  for (const { pattern, resource } of ROUTE_TO_RESOURCE) {
    if (pattern.test(pathname)) {
      return resource;
    }
  }
  return null;
}

/**
 * HTTP 메서드에서 액션을 추출
 *
 * @param method - HTTP 메서드
 * @returns 매핑된 액션
 */
export function getActionFromMethod(method: string): Action {
  return METHOD_TO_ACTION[method.toUpperCase()] ?? "read";
}

/**
 * 특정 역할이 특정 경로에 특정 메서드로 접근할 수 있는지 확인
 *
 * @param role - 사용자 역할 (lowercase)
 * @param pathname - 요청 경로
 * @param method - HTTP 메서드 (기본값: GET)
 * @returns 접근 가능 여부 및 필요 정보
 *
 * @example
 * canAccessRoute('viewer', '/api/docker/containers', 'GET')
 * // { allowed: true, resource: 'docker', action: 'read' }
 *
 * canAccessRoute('viewer', '/api/docker/containers', 'POST')
 * // { allowed: false, resource: 'docker', action: 'write', requiredRole: 'user' }
 */
export function canAccessRoute(
  role: UserRole,
  pathname: string,
  method: string = "GET"
): {
  allowed: boolean;
  resource: Resource | null;
  action: Action;
  requiredRole?: UserRole;
} {
  const resource = getResourceFromPath(pathname);
  const action = getActionFromMethod(method);

  // 보호되지 않은 경로인 경우 통과
  if (!resource) {
    return { allowed: true, resource: null, action };
  }

  const allowed = hasPermission(role, resource, action);

  // 권한이 없는 경우, 필요한 역할 계산
  if (!allowed) {
    const requiredRole = findMinimumRequiredRole(resource, action);
    return { allowed: false, resource, action, requiredRole };
  }

  return { allowed: true, resource, action };
}

/**
 * 특정 리소스 + 액션에 필요한 최소 역할 찾기
 *
 * @param resource - 대상 리소스
 * @param action - 수행할 액션
 * @returns 최소 필요 역할
 */
export function findMinimumRequiredRole(
  resource: Resource,
  action: Action
): UserRole {
  // 권한 수준이 낮은 순서대로 확인
  const roleHierarchy: UserRole[] = ["viewer", "user", "admin"];

  for (const role of roleHierarchy) {
    if (hasPermission(role, resource, action)) {
      return role;
    }
  }

  // 기본적으로 admin 필요
  return "admin";
}

/**
 * 역할 계층 비교 (높은 역할이 낮은 역할보다 큰지)
 *
 * @param role - 비교할 역할
 * @param requiredRole - 기준 역할
 * @returns role이 requiredRole 이상인지 여부
 */
export function isRoleAtLeast(role: UserRole, requiredRole: UserRole): boolean {
  const roleLevel: Record<UserRole, number> = {
    viewer: 1,
    user: 2,
    admin: 3,
  };

  return roleLevel[role] >= roleLevel[requiredRole];
}

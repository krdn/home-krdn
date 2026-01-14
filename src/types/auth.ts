/**
 * 인증 관련 타입 정의
 *
 * 기존 타입과 Prisma 7 모델 간의 호환성을 위해 Legacy 타입을 유지합니다.
 * Phase 18 이후 점진적으로 Prisma 생성 타입으로 마이그레이션됩니다.
 *
 * @see prisma/schema.prisma - User, Role 모델 정의
 */

// ============================================================
// Legacy 타입 (기존 환경변수 기반 인증용)
// ============================================================

/**
 * 사용자 역할 (Legacy)
 * 기존 코드와의 호환성을 위해 lowercase 유지
 */
export type UserRole = "admin" | "user" | "viewer";

/**
 * 사용자 인터페이스 (Legacy)
 * 기존 JWT 기반 인증 시스템에서 사용
 */
export interface User {
  id: string;
  username: string;
  role: UserRole;
}

// ============================================================
// JWT 관련 타입
// ============================================================

/**
 * JWT 페이로드 인터페이스
 * jose 라이브러리와 함께 사용
 */
export interface JWTPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat: number;  // issued at (발급 시간)
  exp: number;  // expiration (만료 시간)
}

/**
 * 토큰 검증 결과
 */
export type TokenVerifyResult =
  | { valid: true; payload: JWTPayload }
  | { valid: false; error: string };

// ============================================================
// 인증 흐름 타입
// ============================================================

/**
 * 인증 결과 타입
 */
export type AuthResult =
  | { success: true; user: User; token: string }
  | { success: false; error: string };

/**
 * 세션 정보
 */
export interface Session {
  user: User;
  expiresAt: number;
}

/**
 * 로그인 요청 타입
 */
export interface LoginRequest {
  username: string;
  password: string;
}

// ============================================================
// Prisma 타입 호환 (Phase 18+ 준비)
// ============================================================

/**
 * Prisma Role enum과 Legacy UserRole 간 매핑
 *
 * Prisma: "ADMIN" | "USER" | "VIEWER"
 * Legacy: "admin" | "user" | "viewer"
 */
export const PrismaRoleToLegacy: Record<string, UserRole> = {
  ADMIN: "admin",
  USER: "user",
  VIEWER: "viewer",
};

export const LegacyRoleToPrisma: Record<UserRole, string> = {
  admin: "ADMIN",
  user: "USER",
  viewer: "VIEWER",
};

/**
 * Prisma User를 Legacy User로 변환하는 헬퍼 타입
 * Phase 18에서 실제 구현 예정
 *
 * @example
 * import { User as PrismaUser } from '@prisma/client'
 *
 * function toLegacyUser(prismaUser: PrismaUser): User {
 *   return {
 *     id: prismaUser.id,
 *     username: prismaUser.username,
 *     role: PrismaRoleToLegacy[prismaUser.role],
 *   }
 * }
 */
export type PrismaUserCompat = {
  id: string;
  email: string;
  username: string;
  role: string; // Prisma enum은 string으로 전달됨
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
};

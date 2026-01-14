/**
 * 인증 관련 타입 정의
 */

// 사용자 역할
export type UserRole = "admin" | "user";

// 사용자 인터페이스
export interface User {
  id: string;
  username: string;
  role: UserRole;
}

// JWT 페이로드 인터페이스
export interface JWTPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat: number;  // issued at (발급 시간)
  exp: number;  // expiration (만료 시간)
}

// 인증 결과 타입
export type AuthResult =
  | { success: true; user: User; token: string }
  | { success: false; error: string };

// 세션 정보
export interface Session {
  user: User;
  expiresAt: number;
}

// 로그인 요청 타입
export interface LoginRequest {
  username: string;
  password: string;
}

// 토큰 검증 결과
export type TokenVerifyResult =
  | { valid: true; payload: JWTPayload }
  | { valid: false; error: string };

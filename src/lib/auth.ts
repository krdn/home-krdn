/**
 * Authentication Library
 * JWT 기반 인증 유틸리티 함수들
 */

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { User, JWTPayload, TokenVerifyResult } from "@/types/auth";

// JWT 설정
const JWT_ALGORITHM = "HS256";
const JWT_EXPIRY = "15m"; // 15분

// 환경 변수에서 시크릿 키 로드
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET 환경 변수가 설정되지 않았습니다");
  }
  return new TextEncoder().encode(secret);
}

/**
 * JWT 토큰을 생성합니다.
 * @param user 사용자 정보
 * @returns JWT 토큰 문자열
 */
export async function createToken(user: User): Promise<string> {
  const secret = getJwtSecret();

  const token = await new SignJWT({
    userId: user.id,
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret);

  return token;
}

/**
 * JWT 토큰을 검증합니다.
 * @param token JWT 토큰 문자열
 * @returns 검증 결과 (성공 시 페이로드 포함)
 */
export async function verifyToken(token: string): Promise<TokenVerifyResult> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    });

    // 페이로드 타입 검증
    if (
      typeof payload.userId !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.role !== "string"
    ) {
      return { valid: false, error: "유효하지 않은 토큰 페이로드" };
    }

    return {
      valid: true,
      payload: {
        userId: payload.userId,
        username: payload.username,
        role: payload.role as "admin" | "user",
        iat: payload.iat ?? 0,
        exp: payload.exp ?? 0,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      // 토큰 만료
      if (error.message.includes("expired")) {
        return { valid: false, error: "토큰이 만료되었습니다" };
      }
      // 서명 검증 실패
      if (error.message.includes("signature")) {
        return { valid: false, error: "유효하지 않은 토큰 서명" };
      }
    }
    return { valid: false, error: "토큰 검증 실패" };
  }
}

/**
 * 비밀번호를 해싱합니다.
 * @param password 평문 비밀번호
 * @returns 해시된 비밀번호
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * 비밀번호를 비교합니다.
 * @param password 평문 비밀번호
 * @param hash 해시된 비밀번호
 * @returns 일치 여부
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 환경 변수에서 관리자 정보를 가져옵니다.
 * 홈서버는 단일 관리자 계정만 사용합니다.
 * @returns 관리자 사용자 정보
 */
export function getAdminUser(): User {
  const username = process.env.ADMIN_USERNAME;

  if (!username) {
    throw new Error("ADMIN_USERNAME 환경 변수가 설정되지 않았습니다");
  }

  return {
    id: "admin-001", // 단일 관리자이므로 고정 ID
    username,
    role: "admin",
  };
}

/**
 * 환경 변수에서 관리자 비밀번호 해시를 가져옵니다.
 * @returns 해시된 비밀번호
 */
export function getAdminPasswordHash(): string {
  const hash = process.env.ADMIN_PASSWORD_HASH;

  if (!hash) {
    throw new Error("ADMIN_PASSWORD_HASH 환경 변수가 설정되지 않았습니다");
  }

  return hash;
}

/**
 * 사용자 로그인을 처리합니다.
 * @param username 사용자명
 * @param password 비밀번호
 * @returns 인증 결과 (성공 시 토큰 포함)
 */
export async function authenticateUser(
  username: string,
  password: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const adminUser = getAdminUser();

  // 사용자명 확인
  if (username !== adminUser.username) {
    return { success: false, error: "잘못된 사용자명 또는 비밀번호" };
  }

  // 비밀번호 확인
  const passwordHash = getAdminPasswordHash();
  const isValid = await comparePassword(password, passwordHash);

  if (!isValid) {
    return { success: false, error: "잘못된 사용자명 또는 비밀번호" };
  }

  // 토큰 생성
  const token = await createToken(adminUser);

  return { success: true, token };
}

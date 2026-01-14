/**
 * Next.js Middleware for API Protection
 * 보호된 API 라우트에 대한 인증 검사를 수행합니다.
 *
 * Edge Runtime 호환을 위해 jose 라이브러리를 직접 사용합니다.
 * bcryptjs는 Node.js 전용이므로 미들웨어에서 사용하지 않습니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// JWT 설정
const JWT_ALGORITHM = "HS256";
const COOKIE_NAME = "auth-token";

/**
 * JWT 시크릿 키를 가져옵니다.
 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET 환경 변수가 설정되지 않았습니다");
  }
  return new TextEncoder().encode(secret);
}

/**
 * JWT 토큰을 검증합니다. (Edge Runtime 호환)
 * @param token JWT 토큰 문자열
 * @returns 유효 여부
 */
async function verifyTokenEdge(token: string): Promise<boolean> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    });

    // 필수 필드 확인
    return (
      typeof payload.userId === "string" &&
      typeof payload.username === "string" &&
      typeof payload.role === "string"
    );
  } catch {
    return false;
  }
}

/**
 * 미들웨어 함수
 * 보호된 경로에 대한 인증 검사를 수행합니다.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 쿠키에서 토큰 추출
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // 토큰이 없거나 유효하지 않은 경우
  if (!token || !(await verifyTokenEdge(token))) {
    // API 요청인 경우: 401 JSON 응답
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "인증이 필요합니다", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 페이지 요청인 경우: /login으로 리다이렉트
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 인증 성공: 요청 통과
  return NextResponse.next();
}

/**
 * 미들웨어가 적용될 경로 설정
 * 보호할 경로만 명시합니다.
 */
export const config = {
  matcher: [
    // 시스템 메트릭 API
    "/api/system/:path*",
    // Docker 관리 API
    "/api/docker/:path*",
    // 관리자 페이지
    "/admin/:path*",
  ],
};

/**
 * 로그아웃 API 엔드포인트
 * POST /api/auth/logout
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  // 성공 응답 생성
  const response = NextResponse.json({
    success: true,
    message: "Logged out",
  });

  // auth-token 쿠키 삭제 (maxAge: 0으로 설정)
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // 즉시 만료
  });

  return response;
}

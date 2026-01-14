/**
 * 로그인 API 엔드포인트
 * POST /api/auth/login
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, getAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 요청 body에서 username, password 추출
    const body = await request.json();
    const { username, password } = body;

    // 필수 필드 검증
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password required" },
        { status: 400 }
      );
    }

    // 사용자 인증
    const result = await authenticateUser(username, password);

    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 관리자 정보 가져오기
    const adminUser = getAdminUser();

    // 성공 응답 생성
    const response = NextResponse.json({
      success: true,
      user: {
        username: adminUser.username,
        role: adminUser.role,
      },
    });

    // httpOnly 쿠키로 JWT 설정
    response.cookies.set("auth-token", result.token, {
      httpOnly: true, // XSS 방지
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15분 (900초)
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    // JSON 파싱 오류 처리
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * 로그인 API 엔드포인트
 * POST /api/auth/login
 *
 * Phase 18: DB 기반 인증으로 전환
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateUserFromDB } from "@/lib/auth";
import { findUserByUsername, toUserDto } from "@/lib/user-service";

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

    // 사용자 인증 (DB 기반)
    const result = await authenticateUserFromDB(username, password);

    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // DB에서 사용자 정보 조회
    const user = await findUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    // 레거시 호환 DTO로 변환
    const userDto = toUserDto(user);

    // 성공 응답 생성
    const response = NextResponse.json({
      success: true,
      user: {
        username: userDto.username,
        role: userDto.role,
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

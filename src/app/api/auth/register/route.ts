/**
 * 회원가입 API 엔드포인트
 * POST /api/auth/register
 *
 * Phase 18: 멀티 유저 회원가입 지원
 */

import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/auth";
import {
  createUser,
  isEmailTaken,
  isUsernameTaken,
  RegisterInputSchema,
  toUserDto,
} from "@/lib/user-service";
import { findUserByUsername } from "@/lib/user-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 요청 body 파싱
    const body = await request.json();

    // Zod 스키마로 입력 검증
    const parseResult = RegisterInputSchema.safeParse(body);

    if (!parseResult.success) {
      // 검증 실패 시 첫 번째 에러 메시지 반환
      const firstError = parseResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: firstError.message,
          field: firstError.path[0],
        },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // 이메일 중복 검사
    if (await isEmailTaken(input.email)) {
      return NextResponse.json(
        { success: false, error: "이미 사용 중인 이메일입니다" },
        { status: 409 }
      );
    }

    // 사용자명 중복 검사
    if (await isUsernameTaken(input.username)) {
      return NextResponse.json(
        { success: false, error: "이미 사용 중인 사용자명입니다" },
        { status: 409 }
      );
    }

    // 사용자 생성
    const createdUser = await createUser(input);

    // 자동 로그인: JWT 토큰 생성을 위해 전체 사용자 정보 조회
    const user = await findUserByUsername(input.username);
    if (!user) {
      // 생성 직후 조회 실패는 시스템 에러
      throw new Error("사용자 생성 후 조회 실패");
    }

    // JWT 토큰 생성
    const userDto = toUserDto(user);
    const token = await createToken(userDto);

    // 성공 응답 생성
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: createdUser.id,
          username: createdUser.username,
          email: createdUser.email,
          role: userDto.role,
        },
      },
      { status: 201 }
    );

    // httpOnly 쿠키로 JWT 설정 (자동 로그인)
    response.cookies.set("auth-token", token, {
      httpOnly: true, // XSS 방지
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15분 (900초)
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);

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

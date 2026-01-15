/**
 * 회원가입 API 엔드포인트
 * POST /api/auth/register
 *
 * Phase 18: 멀티 유저 회원가입 지원
 * Phase 27: 표준화된 에러 핸들링 적용
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
import { ConflictError, DatabaseError } from "@/lib/errors";
import { createErrorResponse } from "@/lib/api-error-handler";
import { logError, extractRequestContext } from "@/lib/error-logger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 요청 body 파싱
    const body = await request.json();

    // Zod 스키마로 입력 검증 (ZodError는 createErrorResponse에서 처리)
    const input = RegisterInputSchema.parse(body);

    // 이메일 중복 검사
    if (await isEmailTaken(input.email)) {
      throw new ConflictError("이미 사용 중인 이메일입니다", "email");
    }

    // 사용자명 중복 검사
    if (await isUsernameTaken(input.username)) {
      throw new ConflictError("이미 사용 중인 사용자명입니다", "username");
    }

    // 사용자 생성
    const createdUser = await createUser(input);

    // 자동 로그인: JWT 토큰 생성을 위해 전체 사용자 정보 조회
    const user = await findUserByUsername(input.username);
    if (!user) {
      // 생성 직후 조회 실패는 시스템 에러
      throw new DatabaseError("사용자 생성 후 조회 실패");
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
    logError(error, extractRequestContext(request));
    return createErrorResponse(error);
  }
}

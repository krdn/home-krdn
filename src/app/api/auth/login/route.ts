/**
 * 로그인 API 엔드포인트
 * POST /api/auth/login
 *
 * Phase 18: DB 기반 인증으로 전환
 * Phase 27: 표준화된 에러 핸들링 적용
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateUserFromDB } from "@/lib/auth";
import { findUserByUsername, toUserDto } from "@/lib/user-service";
import { ValidationError, AuthError } from "@/lib/errors";
import { createErrorResponse } from "@/lib/api-error-handler";
import { logError, extractRequestContext } from "@/lib/error-logger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 요청 body에서 username, password 추출
    const body = await request.json();
    const { username, password } = body;

    // 필수 필드 검증
    if (!username || !password) {
      throw new ValidationError("사용자명과 비밀번호를 입력해주세요");
    }

    // 사용자 인증 (DB 기반)
    const result = await authenticateUserFromDB(username, password);

    if (!result.success || !result.token) {
      throw new AuthError("잘못된 인증 정보입니다", "INVALID_CREDENTIALS");
    }

    // DB에서 사용자 정보 조회
    const user = await findUserByUsername(username);
    if (!user) {
      throw new AuthError("사용자를 찾을 수 없습니다", "INVALID_CREDENTIALS");
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
    logError(error, extractRequestContext(request));
    return createErrorResponse(error);
  }
}

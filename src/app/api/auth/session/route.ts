/**
 * 세션 검증 API 엔드포인트
 * GET /api/auth/session
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 auth-token 추출
    const token = request.cookies.get("auth-token")?.value;

    // 토큰이 없는 경우
    if (!token) {
      return NextResponse.json(
        { authenticated: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // 토큰 검증
    const result = await verifyToken(token);

    // 토큰이 유효하지 않은 경우
    if (!result.valid) {
      return NextResponse.json(
        { authenticated: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // 유효한 세션 - 사용자 정보 반환
    return NextResponse.json({
      authenticated: true,
      user: {
        userId: result.payload.userId,
        username: result.payload.username,
        role: result.payload.role,
      },
    });
  } catch (error) {
    console.error("Session verification error:", error);
    return NextResponse.json(
      { authenticated: false, error: "Not authenticated" },
      { status: 401 }
    );
  }
}

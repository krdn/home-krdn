/**
 * Projects Scan API Route
 * GET: 파일시스템에서 프로젝트 스캔 (auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyToken } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import {
  scanProjects,
  isPathAllowed,
  getAllowedBasePaths,
} from "@/lib/project-scanner";
import type { UserRole } from "@/types/auth";

export const dynamic = "force-dynamic";

// 쿼리 파라미터 스키마
const querySchema = z.object({
  basePath: z.string().optional(),
  maxDepth: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 3))
    .refine((val) => val >= 1 && val <= 5, {
      message: "maxDepth는 1~5 사이여야 합니다",
    }),
});

/**
 * 인증 및 권한 확인 헬퍼 함수
 */
async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const result = await verifyToken(token);
  if (!result.valid) {
    throw new Error("UNAUTHORIZED");
  }

  return result.payload;
}

/**
 * 리소스에 대한 쓰기 권한 확인
 */
function requireWritePermission(role: UserRole): void {
  if (!hasPermission(role, "projects", "write")) {
    throw new Error("FORBIDDEN");
  }
}

/**
 * GET /api/projects/scan
 * 파일시스템에서 프로젝트 스캔 (user 이상 권한 필요)
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 및 권한 확인
    const payload = await requireAuth();
    requireWritePermission(payload.role as UserRole);

    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 파싱 및 검증
    const parseResult = querySchema.safeParse({
      basePath: searchParams.get("basePath") || undefined,
      maxDepth: searchParams.get("maxDepth") || undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "유효하지 않은 파라미터입니다",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { basePath, maxDepth } = parseResult.data;

    // 기본 경로가 없으면 허용된 경로 목록 반환
    if (!basePath) {
      return NextResponse.json({
        success: true,
        allowedPaths: getAllowedBasePaths(),
        message: "basePath 파라미터를 지정해주세요",
      });
    }

    // 경로 유효성 검사
    if (!isPathAllowed(basePath)) {
      return NextResponse.json(
        {
          success: false,
          error: "허용되지 않은 경로입니다",
          allowedPaths: getAllowedBasePaths(),
        },
        { status: 403 }
      );
    }

    // 프로젝트 스캔 수행
    const scannedProjects = await scanProjects(basePath, maxDepth);

    return NextResponse.json({
      success: true,
      basePath,
      maxDepth,
      projects: scannedProjects,
      total: scannedProjects.length,
      registered: scannedProjects.filter((p) => p.isRegistered).length,
      unregistered: scannedProjects.filter((p) => !p.isRegistered).length,
    });
  } catch (error) {
    // 인증 오류
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // 권한 오류
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "프로젝트 관리 권한이 필요합니다" },
        { status: 403 }
      );
    }

    console.error("프로젝트 스캔 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "스캔에 실패했습니다",
      },
      { status: 500 }
    );
  }
}

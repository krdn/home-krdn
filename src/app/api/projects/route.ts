/**
 * Projects API Route
 * GET: 프로젝트 목록 조회 (public)
 * POST: 새 프로젝트 생성 (auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyToken } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import {
  getSortedProjects,
  getAllCategories,
  createProject,
} from "@/lib/projects";
import {
  createProjectSchema,
  type Project,
  type ProjectCategory,
  type ProjectStatus,
} from "@/types/project";
import type { UserRole } from "@/types/auth";

export const dynamic = "force-dynamic";

// 쿼리 파라미터 스키마 정의
const querySchema = z.object({
  category: z
    .enum(["web", "automation", "ai", "infra", "other", "all"])
    .optional()
    .default("all"),
  status: z
    .enum(["active", "completed", "archived", "planned", "all"])
    .optional()
    .default("all"),
  featured: z
    .enum(["true", "false"])
    .optional()
    .transform((val) =>
      val === "true" ? true : val === "false" ? false : undefined
    ),
});

/**
 * 인증 및 권한 확인 헬퍼 함수
 * @throws 인증 실패 시 에러
 * @returns JWT 페이로드 (역할 정보 포함)
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
 * @throws 권한 없는 경우 에러
 */
function requireWritePermission(role: UserRole): void {
  if (!hasPermission(role, "projects", "write")) {
    const error = new Error("FORBIDDEN");
    (error as Error & { requiredPermission: string }).requiredPermission =
      "프로젝트 쓰기 권한이 필요합니다. 필요 역할: user 이상";
    throw error;
  }
}

/**
 * GET /api/projects
 * 프로젝트 목록 조회 (public)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 파싱 및 검증
    const parseResult = querySchema.safeParse({
      category: searchParams.get("category") || undefined,
      status: searchParams.get("status") || undefined,
      featured: searchParams.get("featured") || undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { category, status, featured } = parseResult.data;

    // 정렬된 프로젝트 목록 가져오기
    let filteredProjects: Project[] = await getSortedProjects();

    // 카테고리 필터링
    if (category !== "all") {
      filteredProjects = filteredProjects.filter(
        (p) => p.category === (category as ProjectCategory)
      );
    }

    // 상태 필터링
    if (status !== "all") {
      filteredProjects = filteredProjects.filter(
        (p) => p.status === (status as ProjectStatus)
      );
    }

    // Featured 필터링
    if (featured !== undefined) {
      filteredProjects = filteredProjects.filter(
        (p) => p.featured === featured
      );
    }

    // 응답 데이터 구성
    const categories = await getAllCategories();
    const responseData = {
      success: true,
      projects: filteredProjects,
      total: filteredProjects.length,
      categories,
      filters: {
        category,
        status,
        featured,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Failed to get projects:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get projects" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * 새 프로젝트 생성 (user 이상 권한 필요)
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 및 권한 확인
    const payload = await requireAuth();
    requireWritePermission(payload.role as UserRole);

    // 요청 본문 파싱
    const body = await request.json();

    // Zod 스키마로 검증
    const parseResult = createProjectSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "유효하지 않은 입력입니다",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    // 프로젝트 생성
    const newProject = await createProject(parseResult.data);

    return NextResponse.json(
      {
        success: true,
        project: newProject,
      },
      { status: 201 }
    );
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
      const errorWithPermission = error as Error & {
        requiredPermission?: string;
      };
      return NextResponse.json(
        {
          success: false,
          error:
            errorWithPermission.requiredPermission ??
            "해당 작업에 대한 권한이 없습니다",
        },
        { status: 403 }
      );
    }

    // 슬러그 중복 오류
    if (error instanceof Error && error.message.includes("이미 존재합니다")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }

    console.error("Failed to create project:", error);
    return NextResponse.json(
      { success: false, error: "프로젝트 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}

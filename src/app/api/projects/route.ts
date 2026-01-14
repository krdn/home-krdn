import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  projects,
  getSortedProjects,
  getAllCategories,
} from "@/config/projects";
import type { Project, ProjectCategory, ProjectStatus } from "@/types/project";

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
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
});

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
    let filteredProjects: Project[] = getSortedProjects();

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
    const responseData = {
      success: true,
      projects: filteredProjects,
      total: filteredProjects.length,
      categories: getAllCategories(),
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

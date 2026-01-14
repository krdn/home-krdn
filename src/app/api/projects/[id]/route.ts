/**
 * Projects [id] API Route
 * GET: 단일 프로젝트 조회 (public)
 * PUT: 프로젝트 수정 (auth required)
 * DELETE: 프로젝트 삭제 (auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import {
  getProjectById,
  updateProject,
  deleteProject,
} from "@/lib/projects";
import { updateProjectSchema } from "@/types/project";

export const dynamic = "force-dynamic";

// Route params 타입
type Params = Promise<{ id: string }>;

/**
 * 인증 확인 헬퍼 함수
 * @throws 인증 실패 시 에러
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
 * GET /api/projects/[id]
 * 단일 프로젝트 조회 (public)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    const project = await getProjectById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Failed to get project:", error);
    return NextResponse.json(
      { success: false, error: "프로젝트 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]
 * 프로젝트 수정 (auth required)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    // 인증 확인
    await requireAuth();

    const { id } = await params;

    // 프로젝트 존재 확인
    const existingProject = await getProjectById(id);
    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();

    // Zod 스키마로 검증
    const parseResult = updateProjectSchema.safeParse(body);
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

    // 프로젝트 업데이트
    const updatedProject = await updateProject(id, parseResult.data);

    return NextResponse.json({
      success: true,
      project: updatedProject,
    });
  } catch (error) {
    // 인증 오류
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // 슬러그 중복 오류
    if (error instanceof Error && error.message.includes("이미 존재합니다")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }

    console.error("Failed to update project:", error);
    return NextResponse.json(
      { success: false, error: "프로젝트 수정에 실패했습니다" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * 프로젝트 삭제 (auth required)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    // 인증 확인
    await requireAuth();

    const { id } = await params;

    // 프로젝트 존재 확인
    const existingProject = await getProjectById(id);
    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 프로젝트 삭제
    await deleteProject(id);

    return NextResponse.json({
      success: true,
      message: "프로젝트가 삭제되었습니다",
    });
  } catch (error) {
    // 인증 오류
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    console.error("Failed to delete project:", error);
    return NextResponse.json(
      { success: false, error: "프로젝트 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}

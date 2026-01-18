/**
 * Services API - Single Service Route
 * 개별 서비스 CRUD API
 */

import { NextResponse } from "next/server";
import {
  getServiceById,
  updateService,
  deleteService,
  type UpdateServiceInput,
} from "@/lib/services";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/services/[id]
 * 특정 서비스 조회
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const service = await getServiceById(id);

    if (!service) {
      return NextResponse.json(
        { success: false, error: `ID '${id}'인 서비스를 찾을 수 없습니다` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error("Failed to get service:", error);
    return NextResponse.json(
      { success: false, error: "서비스를 가져올 수 없습니다" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/services/[id]
 * 서비스 수정
 */
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input: UpdateServiceInput = await request.json();

    const updatedService = await updateService(id, input);

    return NextResponse.json({
      success: true,
      data: updatedService,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서비스 수정에 실패했습니다";
    console.error("Failed to update service:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/services/[id]
 * 서비스 삭제
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await deleteService(id);

    return NextResponse.json({
      success: true,
      message: `서비스 '${id}'가 삭제되었습니다`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서비스 삭제에 실패했습니다";
    console.error("Failed to delete service:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

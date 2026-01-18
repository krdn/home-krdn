/**
 * Services API Route
 * JSON 파일 기반 서비스 데이터 CRUD API
 */

import { NextResponse } from "next/server";
import {
  getAllServices,
  getServicesByCategory,
  createService,
  type CreateServiceInput,
} from "@/lib/services";
import type { ServiceCategory } from "@/types/service";

export const dynamic = "force-dynamic";

/**
 * GET /api/services
 * 서비스 목록 조회 (카테고리 필터 지원)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as ServiceCategory | "all" | null;

    const services = category
      ? await getServicesByCategory(category)
      : await getAllServices();

    return NextResponse.json({
      success: true,
      data: services,
      count: services.length,
    });
  } catch (error) {
    console.error("Failed to get services:", error);
    return NextResponse.json(
      { success: false, error: "서비스 목록을 가져올 수 없습니다" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/services
 * 새 서비스 생성
 */
export async function POST(request: Request) {
  try {
    const input: CreateServiceInput = await request.json();

    // 필수 필드 검증
    if (!input.id || !input.name || !input.description || !input.category) {
      return NextResponse.json(
        { success: false, error: "필수 필드가 누락되었습니다 (id, name, description, category)" },
        { status: 400 }
      );
    }

    const newService = await createService(input);

    return NextResponse.json({
      success: true,
      data: newService,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서비스 생성에 실패했습니다";
    console.error("Failed to create service:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

/**
 * Services CRUD Library
 * JSON 파일 기반 서비스 데이터 관리 유틸리티
 *
 * 서버 전용 모듈 - Node.js fs 모듈 사용
 */

import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { Service, ServiceCategory, ServiceStatus, ServiceUrls } from "@/types/service";
import { syncServicePort } from "@/lib/port-service";

// 데이터 파일 경로
const DATA_FILE = path.join(process.cwd(), "data/services.json");

// 데이터 파일 구조 인터페이스
interface ServicesData {
  services: Service[];
  lastUpdated: string;
}

// Service 생성 입력 타입
export interface CreateServiceInput {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  category: ServiceCategory;
  status?: ServiceStatus;
  techStack: string[];
  port?: number;
  path?: string;
  url?: string;
  urls?: ServiceUrls;  // 환경별 URL 추가
  docsUrl?: string;
  githubUrl?: string;
  features: string[];
  containers?: string[];
  screenshot?: string;
  icon?: string;
}

// Service 업데이트 입력 타입
export type UpdateServiceInput = Partial<CreateServiceInput>;

/**
 * 데이터 파일을 읽어 파싱합니다.
 */
async function readDataFile(): Promise<ServicesData> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data) as ServicesData;
  } catch (error) {
    console.error("Failed to read services data file:", error);
    return { services: [], lastUpdated: new Date().toISOString() };
  }
}

/**
 * 데이터를 파일에 저장합니다.
 */
async function writeDataFile(data: ServicesData): Promise<void> {
  data.lastUpdated = new Date().toISOString();
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ========== CRUD 함수들 ==========

/**
 * 모든 서비스 목록을 조회합니다.
 */
export async function getAllServices(): Promise<Service[]> {
  const data = await readDataFile();
  return data.services;
}

/**
 * ID로 서비스를 조회합니다.
 */
export async function getServiceById(id: string): Promise<Service | null> {
  const services = await getAllServices();
  return services.find((s) => s.id === id) || null;
}

/**
 * 카테고리별 서비스를 조회합니다.
 */
export async function getServicesByCategory(
  category: ServiceCategory | "all"
): Promise<Service[]> {
  const services = await getAllServices();
  if (category === "all") return services;
  return services.filter((s) => s.category === category);
}

/**
 * 실행 중인 서비스를 조회합니다.
 */
export async function getRunningServices(): Promise<Service[]> {
  const services = await getAllServices();
  return services.filter((s) => s.status === "running");
}

/**
 * ID 중복 여부를 확인합니다.
 */
export async function isServiceIdDuplicate(
  id: string,
  excludeId?: string
): Promise<boolean> {
  const services = await getAllServices();
  return services.some((s) => s.id === id && s.id !== excludeId);
}

/**
 * 새 서비스를 생성합니다.
 * 포트가 있으면 Port Registry에 자동 등록합니다.
 */
export async function createService(input: CreateServiceInput): Promise<Service> {
  const data = await readDataFile();

  // ID 중복 검사
  if (await isServiceIdDuplicate(input.id)) {
    throw new Error(`서비스 ID '${input.id}'가 이미 존재합니다`);
  }

  const newService: Service = {
    ...input,
    status: input.status || "stopped",
    containers: input.containers || [],
    techStack: input.techStack || [],
    features: input.features || [],
  };

  data.services.push(newService);
  await writeDataFile(data);

  // 포트가 있으면 Port Registry에 자동 등록
  if (newService.port) {
    try {
      await syncServicePort({
        id: newService.id,
        name: newService.name,
        description: newService.description,
        category: newService.category,
        status: newService.status,
        port: newService.port,
        url: newService.url,
        path: newService.path,
      });
    } catch (portError) {
      console.error("포트 자동 등록 실패:", portError);
      // 포트 등록 실패는 서비스 생성을 막지 않음
    }
  }

  return newService;
}

/**
 * 서비스를 수정합니다.
 */
export async function updateService(
  id: string,
  input: UpdateServiceInput
): Promise<Service> {
  const data = await readDataFile();

  const index = data.services.findIndex((s) => s.id === id);
  if (index === -1) {
    throw new Error(`ID '${id}'인 서비스를 찾을 수 없습니다`);
  }

  // ID 변경 시 중복 검사
  if (input.id && input.id !== id) {
    if (await isServiceIdDuplicate(input.id, id)) {
      throw new Error(`서비스 ID '${input.id}'가 이미 존재합니다`);
    }
  }

  const updatedService: Service = {
    ...data.services[index],
    ...input,
  };

  data.services[index] = updatedService;
  await writeDataFile(data);

  return updatedService;
}

/**
 * 서비스를 삭제합니다.
 */
export async function deleteService(id: string): Promise<boolean> {
  const data = await readDataFile();

  const index = data.services.findIndex((s) => s.id === id);
  if (index === -1) {
    throw new Error(`ID '${id}'인 서비스를 찾을 수 없습니다`);
  }

  data.services.splice(index, 1);
  await writeDataFile(data);

  return true;
}

/**
 * 서비스 상태를 업데이트합니다.
 */
export async function updateServiceStatus(
  id: string,
  status: ServiceStatus
): Promise<Service> {
  return updateService(id, { status });
}

/**
 * 프로젝트 카테고리를 서비스 카테고리로 변환합니다.
 */
export function projectCategoryToServiceCategory(
  projectCategory: string
): ServiceCategory {
  switch (projectCategory) {
    case "ai":
      return "ai";
    case "automation":
    case "n8n":
      return "n8n";
    case "web":
    case "infra":
    case "other":
    default:
      return "infrastructure";
  }
}

/**
 * 프로젝트 데이터에서 서비스를 생성합니다.
 */
export async function createServiceFromProject(projectData: {
  slug: string;
  name: string;
  description: string;
  longDescription?: string;
  category: string;
  techStack: { name: string }[];
  features?: string[];
  links?: { type: string; url: string }[];
  path?: string;
}): Promise<Service | null> {
  // 이미 존재하면 업데이트
  const existing = await getServiceById(projectData.slug);
  if (existing) {
    return updateService(projectData.slug, {
      name: projectData.name,
      description: projectData.description,
      longDescription: projectData.longDescription,
      techStack: projectData.techStack.map((t) => t.name),
      features: projectData.features || [],
    });
  }

  // Demo URL 찾기
  const demoLink = projectData.links?.find((l) => l.type === "demo");
  const githubLink = projectData.links?.find((l) => l.type === "github");

  const serviceCategory = projectCategoryToServiceCategory(projectData.category);

  const serviceInput: CreateServiceInput = {
    id: projectData.slug,
    name: projectData.name,
    description: projectData.description,
    longDescription: projectData.longDescription,
    category: serviceCategory,
    status: "stopped",
    techStack: projectData.techStack.map((t) => t.name),
    path: projectData.path,
    url: demoLink?.url,
    githubUrl: githubLink?.url,
    features: projectData.features || [],
    containers: [],
    icon: getCategoryIcon(serviceCategory),
  };

  return createService(serviceInput);
}

/**
 * 카테고리별 기본 아이콘을 반환합니다.
 */
function getCategoryIcon(category: ServiceCategory): string {
  switch (category) {
    case "ai":
      return "Brain";
    case "n8n":
      return "Workflow";
    case "infrastructure":
      return "Server";
    default:
      return "Box";
  }
}

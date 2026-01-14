/**
 * Projects CRUD Library
 * JSON 파일 기반 프로젝트 데이터 관리 유틸리티
 *
 * 서버 전용 모듈 - Node.js fs 모듈 사용
 */

import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type {
  Project,
  ProjectCategory,
  CreateProjectInput,
  UpdateProjectInput,
} from "@/types/project";

// 데이터 파일 경로
const DATA_FILE = path.join(process.cwd(), "data/projects.json");

// 데이터 파일 구조 인터페이스
interface ProjectsData {
  projects: Project[];
  lastUpdated: string;
}

/**
 * 데이터 파일을 읽어 파싱합니다.
 * @returns 프로젝트 데이터 객체
 */
async function readDataFile(): Promise<ProjectsData> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data) as ProjectsData;
  } catch (error) {
    // 파일이 없거나 파싱 오류 시 빈 데이터 반환
    console.error("Failed to read projects data file:", error);
    return { projects: [], lastUpdated: new Date().toISOString() };
  }
}

/**
 * 데이터를 파일에 저장합니다.
 * @param data 저장할 프로젝트 데이터
 */
async function writeDataFile(data: ProjectsData): Promise<void> {
  // lastUpdated 갱신
  data.lastUpdated = new Date().toISOString();

  // 디렉토리 존재 확인 및 생성
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });

  // JSON 형식으로 저장 (가독성을 위해 2칸 들여쓰기)
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ========== CRUD 함수들 ==========

/**
 * 모든 프로젝트 목록을 조회합니다.
 * @returns 프로젝트 배열
 */
export async function getAllProjects(): Promise<Project[]> {
  const data = await readDataFile();
  return data.projects;
}

/**
 * 정렬된 프로젝트 목록을 조회합니다.
 * @returns order 기준으로 정렬된 프로젝트 배열
 */
export async function getSortedProjects(): Promise<Project[]> {
  const projects = await getAllProjects();
  return [...projects].sort((a, b) => {
    // order 필드가 있으면 우선 정렬
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    // order 필드가 없으면 이름순
    return a.name.localeCompare(b.name);
  });
}

/**
 * 모든 카테고리 목록을 조회합니다.
 * @returns 카테고리 배열
 */
export async function getAllCategories(): Promise<ProjectCategory[]> {
  const projects = await getAllProjects();
  const categories = new Set(projects.map((p) => p.category));
  return Array.from(categories);
}

/**
 * ID로 단일 프로젝트를 조회합니다.
 * @param id 프로젝트 ID
 * @returns 프로젝트 또는 null
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const projects = await getAllProjects();
  return projects.find((p) => p.id === id) || null;
}

/**
 * 슬러그로 단일 프로젝트를 조회합니다.
 * @param slug 프로젝트 슬러그
 * @returns 프로젝트 또는 null
 */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const projects = await getAllProjects();
  return projects.find((p) => p.slug === slug) || null;
}

/**
 * 슬러그 중복 여부를 확인합니다.
 * @param slug 확인할 슬러그
 * @param excludeId 제외할 프로젝트 ID (수정 시)
 * @returns 중복 여부
 */
export async function isSlugDuplicate(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const projects = await getAllProjects();
  return projects.some((p) => p.slug === slug && p.id !== excludeId);
}

/**
 * 새 프로젝트를 생성합니다.
 * @param input 프로젝트 생성 데이터
 * @returns 생성된 프로젝트
 * @throws 슬러그 중복 시 에러
 */
export async function createProject(input: CreateProjectInput): Promise<Project> {
  const data = await readDataFile();

  // 슬러그 중복 검사
  const isDuplicate = await isSlugDuplicate(input.slug);
  if (isDuplicate) {
    throw new Error(`슬러그 '${input.slug}'가 이미 존재합니다`);
  }

  // 새 프로젝트 생성
  const newProject: Project = {
    id: randomUUID(),
    ...input,
    // 기본값 설정
    techStack: input.techStack || [],
    links: input.links || [],
    images: input.images || [],
  };

  // 데이터에 추가
  data.projects.push(newProject);
  await writeDataFile(data);

  return newProject;
}

/**
 * 프로젝트를 수정합니다.
 * @param id 프로젝트 ID
 * @param input 수정할 데이터
 * @returns 수정된 프로젝트
 * @throws 프로젝트를 찾을 수 없거나 슬러그 중복 시 에러
 */
export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<Project> {
  const data = await readDataFile();

  // 프로젝트 찾기
  const index = data.projects.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error(`ID '${id}'인 프로젝트를 찾을 수 없습니다`);
  }

  // 슬러그 변경 시 중복 검사
  if (input.slug && input.slug !== data.projects[index].slug) {
    const isDuplicate = await isSlugDuplicate(input.slug, id);
    if (isDuplicate) {
      throw new Error(`슬러그 '${input.slug}'가 이미 존재합니다`);
    }
  }

  // 프로젝트 업데이트
  const updatedProject: Project = {
    ...data.projects[index],
    ...input,
  };

  data.projects[index] = updatedProject;
  await writeDataFile(data);

  return updatedProject;
}

/**
 * 프로젝트를 삭제합니다.
 * @param id 프로젝트 ID
 * @returns 삭제 성공 여부
 * @throws 프로젝트를 찾을 수 없을 시 에러
 */
export async function deleteProject(id: string): Promise<boolean> {
  const data = await readDataFile();

  // 프로젝트 찾기
  const index = data.projects.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error(`ID '${id}'인 프로젝트를 찾을 수 없습니다`);
  }

  // 프로젝트 삭제
  data.projects.splice(index, 1);
  await writeDataFile(data);

  return true;
}

/**
 * 카테고리별 프로젝트를 조회합니다.
 * @param category 카테고리 ('all'이면 전체)
 * @returns 필터링된 프로젝트 배열
 */
export async function getProjectsByCategory(
  category: ProjectCategory | "all"
): Promise<Project[]> {
  const projects = await getAllProjects();
  if (category === "all") return projects;
  return projects.filter((p) => p.category === category);
}

/**
 * Featured 프로젝트를 조회합니다.
 * @returns Featured 프로젝트 배열
 */
export async function getFeaturedProjects(): Promise<Project[]> {
  const projects = await getAllProjects();
  return projects.filter((p) => p.featured === true);
}

/**
 * 활성 프로젝트를 조회합니다.
 * @returns 활성 상태 프로젝트 배열
 */
export async function getActiveProjects(): Promise<Project[]> {
  const projects = await getAllProjects();
  return projects.filter((p) => p.status === "active");
}

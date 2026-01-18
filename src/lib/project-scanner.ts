/**
 * Project Scanner Library
 * 파일시스템에서 프로젝트를 스캔하고 메타데이터를 추출하는 유틸리티
 *
 * 서버 전용 모듈 - Node.js fs 모듈 사용
 */

import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { getAllProjects } from "./projects";
import type { ProjectCategory } from "@/types/project";

// 스캔된 프로젝트 인터페이스
export interface ScannedProject {
  path: string; // 절대 경로
  name: string; // package.json name 또는 폴더명
  description?: string; // package.json description
  gitRemote?: string; // git remote origin
  hasPackageJson: boolean;
  hasReadme: boolean;
  isRegistered: boolean; // 이미 등록 여부
  suggestedCategory?: ProjectCategory; // 추론된 카테고리
  suggestedSlug?: string; // 추천 슬러그
}

// package.json 구조 (필요한 필드만)
interface PackageJson {
  name?: string;
  description?: string;
  version?: string;
}

// 허용된 스캔 기본 경로
const ALLOWED_BASE_PATHS = [
  "/home/gon/projects",
  "/data/home-data/projects",
];

// 무시할 폴더 패턴
const IGNORE_PATTERNS = [
  "node_modules",
  ".git",
  ".next",
  ".cache",
  "dist",
  "build",
  "coverage",
  "__pycache__",
  ".venv",
  "venv",
];

/**
 * 경로가 허용된 범위 내에 있는지 확인합니다.
 * @param targetPath 확인할 경로
 * @returns 허용 여부
 */
export function isPathAllowed(targetPath: string): boolean {
  const normalizedPath = path.resolve(targetPath);

  // 경로 탈출 방지 (.. 포함 여부)
  if (targetPath.includes("..")) {
    return false;
  }

  // 허용된 기본 경로 중 하나로 시작하는지 확인
  return ALLOWED_BASE_PATHS.some((base) =>
    normalizedPath.startsWith(path.resolve(base))
  );
}

/**
 * 디렉토리가 프로젝트인지 판별합니다.
 * @param dirPath 디렉토리 경로
 * @returns 프로젝트 여부
 */
async function isProject(dirPath: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(dirPath);
    // package.json 또는 .git 존재 시 프로젝트로 인식
    return entries.includes("package.json") || entries.includes(".git");
  } catch {
    return false;
  }
}

/**
 * package.json을 읽어 파싱합니다.
 * @param dirPath 디렉토리 경로
 * @returns PackageJson 또는 null
 */
async function readPackageJson(dirPath: string): Promise<PackageJson | null> {
  try {
    const pkgPath = path.join(dirPath, "package.json");
    const content = await fs.readFile(pkgPath, "utf-8");
    return JSON.parse(content) as PackageJson;
  } catch {
    return null;
  }
}

/**
 * Git remote origin URL을 추출합니다.
 * @param dirPath 디렉토리 경로
 * @returns remote URL 또는 undefined
 */
async function getGitRemote(dirPath: string): Promise<string | undefined> {
  try {
    const configPath = path.join(dirPath, ".git", "config");
    const content = await fs.readFile(configPath, "utf-8");

    // [remote "origin"] 섹션에서 url 추출
    const originMatch = content.match(
      /\[remote "origin"\][^\[]*url\s*=\s*(.+)/
    );
    return originMatch ? originMatch[1].trim() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 폴더명에서 카테고리를 추론합니다.
 * @param folderPath 폴더 경로
 * @returns 추론된 카테고리
 */
function inferCategory(folderPath: string): ProjectCategory {
  const parts = folderPath.split(path.sep);

  // 상위 폴더명으로 카테고리 추론
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === "ai" || lower === "ml") return "ai";
    if (lower === "web" || lower === "frontend" || lower === "backend") return "web";
    if (lower === "n8n" || lower === "automation") return "automation";
    if (lower === "infra" || lower === "devops") return "infra";
  }

  return "other";
}

/**
 * 폴더명에서 슬러그를 생성합니다.
 * @param folderName 폴더명
 * @returns 슬러그 문자열
 */
function generateSlug(folderName: string): string {
  return folderName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * 지정된 경로에서 프로젝트를 스캔합니다.
 * @param basePath 스캔할 기본 경로
 * @param maxDepth 최대 탐색 깊이 (기본: 3)
 * @returns 스캔된 프로젝트 배열
 */
export async function scanProjects(
  basePath: string,
  maxDepth: number = 3
): Promise<ScannedProject[]> {
  const normalizedPath = path.resolve(basePath);

  // 경로 검증
  if (!isPathAllowed(normalizedPath)) {
    throw new Error(`허용되지 않은 경로입니다: ${basePath}`);
  }

  // 기존 등록된 프로젝트 목록 조회
  const registeredProjects = await getAllProjects();
  const registeredPaths = new Set(
    registeredProjects.map((p) => p.id)
  );
  const registeredSlugs = new Set(
    registeredProjects.map((p) => p.slug)
  );

  const scannedProjects: ScannedProject[] = [];

  /**
   * 재귀적으로 디렉토리를 탐색합니다.
   */
  async function scan(dirPath: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        // 무시할 패턴 스킵
        if (IGNORE_PATTERNS.includes(entry.name)) continue;

        // 디렉토리만 처리
        if (!entry.isDirectory()) continue;

        const fullPath = path.join(dirPath, entry.name);

        // 프로젝트인지 확인
        if (await isProject(fullPath)) {
          // 프로젝트 메타데이터 추출
          const packageJson = await readPackageJson(fullPath);
          const gitRemote = await getGitRemote(fullPath);

          // README 존재 여부 확인
          let hasReadme = false;
          try {
            await fs.access(path.join(fullPath, "README.md"));
            hasReadme = true;
          } catch {
            // README가 없음
          }

          const folderName = path.basename(fullPath);
          const suggestedSlug = generateSlug(folderName);

          scannedProjects.push({
            path: fullPath,
            name: packageJson?.name || folderName,
            description: packageJson?.description,
            gitRemote,
            hasPackageJson: packageJson !== null,
            hasReadme,
            isRegistered:
              registeredPaths.has(suggestedSlug) ||
              registeredSlugs.has(suggestedSlug),
            suggestedCategory: inferCategory(fullPath),
            suggestedSlug,
          });
        } else {
          // 프로젝트가 아니면 하위 디렉토리 탐색
          await scan(fullPath, depth + 1);
        }
      }
    } catch (error) {
      console.error(`스캔 중 오류 발생 (${dirPath}):`, error);
    }
  }

  await scan(normalizedPath, 1);

  // 이름순 정렬
  return scannedProjects.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * 허용된 기본 경로 목록을 반환합니다.
 */
export function getAllowedBasePaths(): string[] {
  return [...ALLOWED_BASE_PATHS];
}

/**
 * Projects Import API Route
 * POST: 스캔된 프로젝트를 시스템에 등록 (auth required)
 *
 * 자동 추출 정보:
 * - package.json: name, description, dependencies, homepage
 * - README.md: longDescription, features
 * - .git: GitHub URL, startDate (첫 커밋)
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";
import { verifyToken } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { isPathAllowed } from "@/lib/project-scanner";
import { createProject, isSlugDuplicate } from "@/lib/projects";
import { createServiceFromProject } from "@/lib/services";
import type { UserRole } from "@/types/auth";
import type {
  ProjectCategory,
  CreateProjectInput,
  TechStack,
  ProjectLink,
} from "@/types/project";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

// 요청 바디 스키마
const importSchema = z.object({
  path: z.string().min(1, "경로는 필수입니다"),
  overrides: z
    .object({
      name: z.string().optional(),
      slug: z.string().optional(),
      description: z.string().optional(),
      category: z
        .enum(["web", "automation", "ai", "infra", "other"])
        .optional(),
    })
    .optional(),
});

// package.json 구조
interface PackageJson {
  name?: string;
  description?: string;
  version?: string;
  homepage?: string;
  repository?: string | { url?: string };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

// 기술 스택 매핑 (패키지명 -> 표시명, 아이콘, URL)
const TECH_STACK_MAP: Record<
  string,
  { name: string; icon?: string; url?: string }
> = {
  // Frontend Frameworks
  next: { name: "Next.js", icon: "nextjs", url: "https://nextjs.org" },
  react: { name: "React", icon: "react", url: "https://react.dev" },
  "react-dom": { name: "React", icon: "react", url: "https://react.dev" },
  vue: { name: "Vue.js", icon: "vue", url: "https://vuejs.org" },
  svelte: { name: "Svelte", icon: "svelte", url: "https://svelte.dev" },
  angular: { name: "Angular", icon: "angular", url: "https://angular.io" },

  // Styling
  tailwindcss: {
    name: "Tailwind CSS",
    icon: "tailwindcss",
    url: "https://tailwindcss.com",
  },
  "styled-components": { name: "Styled Components", icon: "styledcomponents" },
  sass: { name: "Sass", icon: "sass", url: "https://sass-lang.com" },

  // State Management
  zustand: { name: "Zustand", icon: "zustand" },
  redux: { name: "Redux", icon: "redux", url: "https://redux.js.org" },
  "@reduxjs/toolkit": {
    name: "Redux Toolkit",
    icon: "redux",
    url: "https://redux-toolkit.js.org",
  },

  // Animation
  "framer-motion": {
    name: "Framer Motion",
    icon: "framer",
    url: "https://www.framer.com/motion",
  },

  // Backend
  express: {
    name: "Express.js",
    icon: "express",
    url: "https://expressjs.com",
  },
  fastify: { name: "Fastify", icon: "fastify", url: "https://fastify.io" },
  hono: { name: "Hono", icon: "hono", url: "https://hono.dev" },
  koa: { name: "Koa", icon: "koa", url: "https://koajs.com" },

  // Database / ORM
  prisma: { name: "Prisma", icon: "prisma", url: "https://prisma.io" },
  "@prisma/client": { name: "Prisma", icon: "prisma", url: "https://prisma.io" },
  drizzle: { name: "Drizzle ORM", icon: "drizzle" },
  "drizzle-orm": { name: "Drizzle ORM", icon: "drizzle" },
  mongoose: { name: "Mongoose", icon: "mongoose" },
  sequelize: { name: "Sequelize", icon: "sequelize" },
  typeorm: { name: "TypeORM", icon: "typeorm" },

  // Database Clients
  pg: { name: "PostgreSQL", icon: "postgresql", url: "https://postgresql.org" },
  mysql2: { name: "MySQL", icon: "mysql", url: "https://mysql.com" },
  "better-sqlite3": { name: "SQLite", icon: "sqlite" },
  sqlite3: { name: "SQLite", icon: "sqlite" },
  redis: { name: "Redis", icon: "redis", url: "https://redis.io" },
  ioredis: { name: "Redis", icon: "redis", url: "https://redis.io" },

  // AI / ML
  "@anthropic-ai/sdk": {
    name: "Claude API",
    icon: "anthropic",
    url: "https://anthropic.com",
  },
  openai: { name: "OpenAI API", icon: "openai", url: "https://openai.com" },
  langchain: { name: "LangChain", icon: "langchain" },
  "@langchain/core": { name: "LangChain", icon: "langchain" },

  // Testing
  vitest: { name: "Vitest", icon: "vitest", url: "https://vitest.dev" },
  jest: { name: "Jest", icon: "jest", url: "https://jestjs.io" },
  playwright: {
    name: "Playwright",
    icon: "playwright",
    url: "https://playwright.dev",
  },
  "@playwright/test": {
    name: "Playwright",
    icon: "playwright",
    url: "https://playwright.dev",
  },
  cypress: { name: "Cypress", icon: "cypress", url: "https://cypress.io" },

  // Editor
  "@tiptap/react": { name: "TipTap", icon: "tiptap", url: "https://tiptap.dev" },
  "@tiptap/core": { name: "TipTap", icon: "tiptap", url: "https://tiptap.dev" },

  // Utilities
  zod: { name: "Zod", icon: "zod", url: "https://zod.dev" },
  axios: { name: "Axios", icon: "axios" },
  swr: { name: "SWR", icon: "swr", url: "https://swr.vercel.app" },
  "@tanstack/react-query": {
    name: "React Query",
    icon: "reactquery",
    url: "https://tanstack.com/query",
  },

  // UI Components
  "@radix-ui/react-dialog": {
    name: "Radix UI",
    icon: "radix",
    url: "https://radix-ui.com",
  },
  "@radix-ui/react-dropdown-menu": {
    name: "Radix UI",
    icon: "radix",
    url: "https://radix-ui.com",
  },
  "lucide-react": {
    name: "Lucide Icons",
    icon: "lucide",
    url: "https://lucide.dev",
  },
  "@heroicons/react": { name: "Heroicons", icon: "heroicons" },

  // Auth
  "next-auth": {
    name: "NextAuth.js",
    icon: "nextauth",
    url: "https://next-auth.js.org",
  },
  "@auth/core": { name: "Auth.js", icon: "authjs", url: "https://authjs.dev" },
  jsonwebtoken: { name: "JWT", icon: "jwt" },

  // Realtime
  "socket.io": { name: "Socket.IO", icon: "socketio", url: "https://socket.io" },
  ws: { name: "WebSocket", icon: "websocket" },

  // Docker/DevOps
  dockerode: { name: "Docker", icon: "docker", url: "https://docker.com" },
};

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
 * 폴더명에서 카테고리를 추론합니다.
 */
function inferCategory(folderPath: string): ProjectCategory {
  const parts = folderPath.split(path.sep);

  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === "ai" || lower === "ml") return "ai";
    if (lower === "web" || lower === "frontend" || lower === "backend")
      return "web";
    if (lower === "n8n" || lower === "automation") return "automation";
    if (lower === "infra" || lower === "devops") return "infra";
  }

  return "other";
}

/**
 * 폴더명에서 슬러그를 생성합니다.
 */
function generateSlug(folderName: string): string {
  return folderName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Git remote origin URL을 추출합니다.
 */
async function getGitRemote(dirPath: string): Promise<string | undefined> {
  try {
    const configPath = path.join(dirPath, ".git", "config");
    const content = await fs.readFile(configPath, "utf-8");
    const originMatch = content.match(
      /\[remote "origin"\][^\[]*url\s*=\s*(.+)/
    );
    return originMatch ? originMatch[1].trim() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Git에서 첫 커밋 날짜를 추출합니다. (프로젝트 시작일)
 */
async function getFirstCommitDate(dirPath: string): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync(
      `git -C "${dirPath}" log --reverse --format=%aI | head -1`,
      { timeout: 5000 }
    );
    const dateStr = stdout.trim();
    if (dateStr) {
      // YYYY-MM-DD 형식으로 변환
      return dateStr.split("T")[0];
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * package.json에서 기술 스택을 추출합니다.
 */
function extractTechStack(packageJson: PackageJson): TechStack[] {
  const techStack: TechStack[] = [];
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  // TypeScript 감지
  if (allDeps["typescript"]) {
    techStack.push({
      name: "TypeScript",
      icon: "typescript",
      url: "https://typescriptlang.org",
    });
  }

  // 매핑된 기술 스택 추출
  for (const [pkg, info] of Object.entries(TECH_STACK_MAP)) {
    if (allDeps[pkg]) {
      techStack.push(info);
    }
  }

  // 중복 제거 (이름 기준)
  const seen = new Set<string>();
  return techStack.filter((tech) => {
    if (seen.has(tech.name)) return false;
    seen.add(tech.name);
    return true;
  });
}

/**
 * README.md 전체 내용을 파싱합니다.
 */
interface ReadmeContent {
  description?: string;
  longDescription?: string;
  features?: string[];
  demoUrl?: string;
}

async function parseReadme(dirPath: string): Promise<ReadmeContent> {
  const result: ReadmeContent = {};

  try {
    const readmePath = path.join(dirPath, "README.md");
    const content = await fs.readFile(readmePath, "utf-8");
    const lines = content.split("\n");

    // 첫 번째 단락 추출 (description)
    let foundHeader = false;
    let descriptionLines: string[] = [];
    let inDescription = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 첫 번째 헤더 찾기
      if (line.startsWith("#") && !foundHeader) {
        foundHeader = true;
        continue;
      }

      // 헤더 이후 시작
      if (foundHeader && !inDescription) {
        // 빈 줄이나 배지 스킵
        if (
          !line.trim() ||
          line.startsWith("![") ||
          line.startsWith("[!") ||
          line.startsWith("<")
        ) {
          continue;
        }
        inDescription = true;
      }

      // 설명 수집
      if (inDescription) {
        // 다음 헤더나 빈 줄 2개면 종료
        if (line.startsWith("#") || (line.trim() === "" && lines[i + 1]?.trim() === "")) {
          break;
        }
        if (line.trim()) {
          descriptionLines.push(line.trim());
        }
      }
    }

    // 설명 정리
    if (descriptionLines.length > 0) {
      const fullDesc = descriptionLines
        .join(" ")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // 마크다운 링크 제거

      result.description = fullDesc.length > 100
        ? fullDesc.substring(0, 100).trim() + "..."
        : fullDesc;

      result.longDescription = fullDesc;
    }

    // Features 섹션 추출 (##, ### 모두 지원)
    const featuresPatterns = [
      /^#{2,3}\s*(features?|주요\s*기능|기능)/i,
      /^#{2,3}\s*(what('s|\s+is)\s+|특징)/i,
      /^#{2,3}\s*(주요\s*구현|구현\s*사항|핵심\s*기능)/i,
      /^#{2,3}\s*(highlights?|key\s*features?)/i,
    ];

    let inFeatures = false;
    const features: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Features 섹션 시작
      if (!inFeatures) {
        for (const pattern of featuresPatterns) {
          if (pattern.test(line)) {
            inFeatures = true;
            break;
          }
        }
        continue;
      }

      // 다른 섹션 시작하면 종료
      if (line.startsWith("#")) {
        break;
      }

      // 리스트 아이템 추출 (체크박스, 이모지 지원)
      const listMatch = line.match(/^[-*]\s*[✅✓☑️]?\s*(.+)$/);
      if (listMatch) {
        let feature = listMatch[1].trim();
        // 마크다운 링크 제거
        feature = feature.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
        // 볼드(**text**) 제거
        feature = feature.replace(/\*\*([^*]+)\*\*/g, "$1");
        // 이탤릭(*text* or _text_) 제거
        feature = feature.replace(/[*_]([^*_]+)[*_]/g, "$1");
        // 앞쪽 이모지/체크박스 제거
        feature = feature.replace(/^[✅✓☑️⭐🚀💡🔥📦🎯]\s*/, "");
        // 콜론 뒤 내용 정리 (예: "LLM 통합: Anthropic Claude API" → "LLM 통합 - Anthropic Claude API")
        feature = feature.replace(/:\s+/, " - ");
        if (feature.length > 0 && feature.length < 200) {
          features.push(feature);
        }
      }
    }

    if (features.length > 0) {
      result.features = features.slice(0, 10); // 최대 10개
    }

    // Demo/Live Demo URL 추출
    const demoPatterns = [
      /\[(?:live\s*)?demo\]?\s*\(([^)]+)\)/i,
      /\[(?:live\s*)?demo\]?\s*:\s*<?([^\s>]+)>?/i,
      /(?:live\s*)?demo\s*(?:url)?:\s*<?([^\s>]+)>?/i,
      /https?:\/\/[^\s)>\]]+\.krdn\.kr[^\s)>\]]*/i,
    ];

    for (const line of lines) {
      for (const pattern of demoPatterns) {
        const match = line.match(pattern);
        if (match) {
          const url = match[1] || match[0];
          // 유효한 URL인지 확인
          if (url.startsWith("http")) {
            result.demoUrl = url.trim();
            break;
          }
        }
      }
      if (result.demoUrl) break;
    }
  } catch {
    // README가 없어도 계속 진행
  }

  return result;
}

/**
 * package.json, git, README에서 링크를 추출합니다.
 * Demo URL 우선순위: package.json homepage > README demoUrl > 기본 패턴
 */
function extractLinks(
  packageJson: PackageJson | null,
  gitRemote: string | undefined,
  readmeDemoUrl: string | undefined,
  slug: string
): ProjectLink[] {
  const links: ProjectLink[] = [];

  // GitHub 링크
  let githubUrl: string | undefined;
  if (gitRemote) {
    if (gitRemote.startsWith("git@github.com:")) {
      githubUrl = gitRemote
        .replace("git@github.com:", "https://github.com/")
        .replace(/\.git$/, "");
    } else if (gitRemote.includes("github.com")) {
      githubUrl = gitRemote.replace(/\.git$/, "");
    }
  }

  if (githubUrl) {
    links.push({ type: "github", url: githubUrl, label: "GitHub" });
  }

  // Demo 링크 (우선순위 적용)
  let demoUrl: string | undefined;
  let demoLabel = "Live Demo";

  // 1. package.json homepage
  if (packageJson?.homepage) {
    const homepage = packageJson.homepage;
    if (!homepage.includes("github.io") && !homepage.includes("github.com")) {
      demoUrl = homepage;
    }
  }

  // 2. README에서 추출한 demoUrl
  if (!demoUrl && readmeDemoUrl) {
    demoUrl = readmeDemoUrl;
  }

  // 3. 기본 패턴 (slug.krdn.kr) - 잘 알려진 프로젝트만
  if (!demoUrl) {
    const knownProjects: Record<string, { url: string; label: string }> = {
      "home-krdn": { url: "https://all.krdn.kr", label: "Live Demo" },
      "docker-n8n": { url: "https://n8n.krdn.kr", label: "n8n Instance" },
      "news-sentiment-analyzer": { url: "https://news.krdn.kr", label: "Live Demo" },
      "ai-note-taking": { url: "https://note.krdn.kr", label: "Live Demo" },
      "claude-code-auto": { url: "https://claude.krdn.kr", label: "Live Demo" },
      "gonsai2": { url: "https://gonsai.krdn.kr", label: "Live Demo" },
    };

    if (knownProjects[slug]) {
      demoUrl = knownProjects[slug].url;
      demoLabel = knownProjects[slug].label;
    }
  }

  if (demoUrl) {
    links.push({ type: "demo", url: demoUrl, label: demoLabel });
  }

  return links;
}

/**
 * 카테고리별 기본 이미지를 반환합니다.
 */
function getDefaultImage(category: ProjectCategory, slug: string): { src: string; alt: string; isPrimary: boolean } {
  // 프로젝트별 커스텀 이미지가 있으면 사용
  const customImages: Record<string, { src: string; alt: string }> = {
    "home-krdn": { src: "/images/projects/home-krdn-dashboard.svg", alt: "Home KRDN 대시보드" },
    "docker-n8n": { src: "/images/projects/docker-n8n-workflow.svg", alt: "n8n 워크플로우" },
    "ai-note-taking": { src: "/images/projects/ai-note-editor.svg", alt: "AI 노트 에디터" },
    "krdn-claude": { src: "/images/projects/krdn-claude-diagram.svg", alt: "KRDN Claude 아키텍처" },
    "news-sentiment-analyzer": { src: "/images/projects/news-sentiment-dashboard.svg", alt: "뉴스 감정 분석" },
    "gonsai2": { src: "/images/projects/gonsai2-architecture.svg", alt: "gonsai2 아키텍처" },
    "claude-code-auto": { src: "/images/projects/claude-code-auto.svg", alt: "Claude Code Auto 아키텍처" },
  };

  if (customImages[slug]) {
    return { ...customImages[slug], isPrimary: true };
  }

  // 카테고리별 기본 이미지
  const defaultImages: Record<ProjectCategory, { src: string; alt: string }> = {
    web: { src: "/images/projects/default-web.svg", alt: "웹 프로젝트" },
    ai: { src: "/images/projects/default-ai.svg", alt: "AI 프로젝트" },
    automation: { src: "/images/projects/default-automation.svg", alt: "자동화 프로젝트" },
    infra: { src: "/images/projects/default-infra.svg", alt: "인프라 프로젝트" },
    other: { src: "/images/projects/default-other.svg", alt: "프로젝트" },
  };

  return { ...defaultImages[category], isPrimary: true };
}

/**
 * Tech Stack과 카테고리를 기반으로 기본 Features를 생성합니다.
 */
function generateDefaultFeatures(
  techStack: TechStack[],
  category: ProjectCategory,
  packageJson: PackageJson | null
): string[] {
  const features: string[] = [];
  const techNames = techStack.map((t) => t.name);

  // Tech Stack 기반 features
  if (techNames.includes("TypeScript")) {
    features.push("TypeScript 기반 타입 안전 개발");
  }
  if (techNames.includes("Next.js") || techNames.includes("Next.js 16")) {
    features.push("Next.js 기반 풀스택 웹 애플리케이션");
  }
  if (techNames.includes("React") || techNames.includes("React 19")) {
    features.push("React 컴포넌트 기반 UI");
  }
  if (techNames.includes("Express.js")) {
    features.push("Express.js REST API 서버");
  }
  if (techNames.includes("Prisma")) {
    features.push("Prisma ORM 기반 데이터베이스 연동");
  }
  if (techNames.includes("Claude API")) {
    features.push("Claude AI API 통합");
  }
  if (techNames.includes("Redis")) {
    features.push("Redis 캐싱 및 세션 관리");
  }
  if (techNames.includes("Docker")) {
    features.push("Docker 컨테이너화 지원");
  }
  if (techNames.includes("Jest") || techNames.includes("Vitest")) {
    features.push("단위 테스트 환경 구성");
  }
  if (techNames.includes("Playwright") || techNames.includes("Cypress")) {
    features.push("E2E 테스트 자동화");
  }
  if (techNames.includes("Socket.IO") || techNames.includes("WebSocket")) {
    features.push("실시간 양방향 통신 지원");
  }
  if (techNames.includes("Tailwind CSS")) {
    features.push("Tailwind CSS 유틸리티 스타일링");
  }

  // 카테고리 기반 기본 features
  if (features.length === 0) {
    switch (category) {
      case "web":
        features.push("웹 애플리케이션", "반응형 디자인");
        break;
      case "ai":
        features.push("AI/ML 기반 기능", "데이터 처리 파이프라인");
        break;
      case "automation":
        features.push("워크플로우 자동화", "스케줄링 및 트리거");
        break;
      case "infra":
        features.push("인프라 관리", "모니터링 및 로깅");
        break;
      default:
        features.push("모듈화된 아키텍처");
    }
  }

  // package.json scripts 기반 추가 features
  if (packageJson?.scripts) {
    const scripts = Object.keys(packageJson.scripts);
    if (scripts.includes("build") && !features.some((f) => f.includes("빌드"))) {
      features.push("프로덕션 빌드 지원");
    }
    if (scripts.includes("lint") && !features.some((f) => f.includes("린트"))) {
      features.push("코드 린팅 및 포맷팅");
    }
  }

  return features.slice(0, 8); // 최대 8개
}

/**
 * POST /api/projects/import
 * 스캔된 프로젝트를 시스템에 등록 (user 이상 권한 필요)
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 및 권한 확인
    const payload = await requireAuth();
    requireWritePermission(payload.role as UserRole);

    // 요청 본문 파싱
    const body = await request.json();
    const parseResult = importSchema.safeParse(body);

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

    const { path: projectPath, overrides } = parseResult.data;

    // 경로 유효성 검사
    if (!isPathAllowed(projectPath)) {
      return NextResponse.json(
        { success: false, error: "허용되지 않은 경로입니다" },
        { status: 403 }
      );
    }

    // 디렉토리 존재 확인
    try {
      const stat = await fs.stat(projectPath);
      if (!stat.isDirectory()) {
        return NextResponse.json(
          { success: false, error: "유효한 디렉토리가 아닙니다" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: "경로가 존재하지 않습니다" },
        { status: 404 }
      );
    }

    // package.json 읽기
    let packageJson: PackageJson | null = null;
    try {
      const pkgPath = path.join(projectPath, "package.json");
      const content = await fs.readFile(pkgPath, "utf-8");
      packageJson = JSON.parse(content) as PackageJson;
    } catch {
      // package.json이 없어도 계속 진행
    }

    // 폴더명 추출
    const folderName = path.basename(projectPath);

    // 슬러그 결정 (override > package.json name > 폴더명)
    const slug =
      overrides?.slug || generateSlug(packageJson?.name || folderName);

    // 슬러그 중복 확인
    if (await isSlugDuplicate(slug)) {
      return NextResponse.json(
        { success: false, error: `슬러그 '${slug}'가 이미 존재합니다` },
        { status: 409 }
      );
    }

    // Git 정보 추출
    const gitRemote = await getGitRemote(projectPath);
    const startDate = await getFirstCommitDate(projectPath);

    // 기술 스택 추출
    const techStack = packageJson ? extractTechStack(packageJson) : [];

    // README 파싱
    const readmeContent = await parseReadme(projectPath);

    // 카테고리 결정
    const category = overrides?.category || inferCategory(projectPath);

    // 링크 추출 (README demoUrl과 slug 전달)
    const links = extractLinks(packageJson, gitRemote, readmeContent.demoUrl, slug);

    // 기본 이미지 설정
    const defaultImage = getDefaultImage(category, slug);

    // description 결정 (우선순위: override > package.json > README > 기본값)
    const description =
      overrides?.description ||
      packageJson?.description ||
      readmeContent.description ||
      `${folderName} 프로젝트`;

    // longDescription 결정
    const longDescription =
      readmeContent.longDescription ||
      packageJson?.description ||
      description;

    // Features 결정 (README > 자동 생성 > 빈 배열)
    let features = readmeContent.features;
    if (!features || features.length === 0) {
      // README에서 추출하지 못하면 기본 features 생성
      features = generateDefaultFeatures(techStack, category, packageJson);
    }

    // 프로젝트 데이터 구성
    const projectData: CreateProjectInput = {
      slug,
      name: overrides?.name || packageJson?.name || folderName,
      description,
      longDescription: longDescription !== description ? longDescription : undefined,
      category,
      status: "active",
      techStack,
      links,
      images: [defaultImage],
      features,
      startDate,
      featured: false,
    };

    // 프로젝트 생성
    const newProject = await createProject(projectData);

    // Services에도 자동 등록
    let serviceCreated = false;
    try {
      await createServiceFromProject({
        slug: newProject.slug,
        name: newProject.name,
        description: newProject.description,
        longDescription: newProject.longDescription,
        category: newProject.category,
        techStack: newProject.techStack,
        features: newProject.features,
        links: newProject.links,
        path: projectPath,
      });
      serviceCreated = true;
    } catch (serviceError) {
      // 서비스 생성 실패는 무시 (프로젝트는 이미 생성됨)
      console.error("Failed to create service:", serviceError);
    }

    return NextResponse.json(
      {
        success: true,
        project: newProject,
        serviceCreated,
        source: {
          path: projectPath,
          hadPackageJson: packageJson !== null,
          hadGitRemote: !!gitRemote,
          extractedTechStack: techStack.length,
          extractedFeatures: features?.length || 0,
          extractedLinks: links.length,
          hadStartDate: !!startDate,
        },
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
      return NextResponse.json(
        { success: false, error: "프로젝트 관리 권한이 필요합니다" },
        { status: 403 }
      );
    }

    console.error("프로젝트 임포트 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "임포트에 실패했습니다",
      },
      { status: 500 }
    );
  }
}

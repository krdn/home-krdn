import { z } from "zod";

// 프로젝트 카테고리
export type ProjectCategory = "web" | "automation" | "ai" | "infra" | "other";

// 프로젝트 상태
export type ProjectStatus = "active" | "completed" | "archived" | "planned";

// 기술 스택 항목
export interface TechStack {
  name: string;
  icon?: string;
  url?: string;
}

// 프로젝트 링크
export interface ProjectLink {
  type: "github" | "demo" | "docs" | "api" | "other";
  url: string;
  label?: string;
}

// 프로젝트 이미지
export interface ProjectImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  isPrimary?: boolean;
}

// 메인 프로젝트 인터페이스
export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription?: string;
  category: ProjectCategory;
  status: ProjectStatus;
  techStack: TechStack[];
  links: ProjectLink[];
  images: ProjectImage[];
  features?: string[];
  startDate?: string;
  endDate?: string;
  featured?: boolean;
  order?: number;
}

// 카테고리 레이블
export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  web: "웹 개발",
  automation: "자동화",
  ai: "AI 프로젝트",
  infra: "인프라",
  other: "기타",
};

// 카테고리 아이콘
export const CATEGORY_ICONS: Record<ProjectCategory, string> = {
  web: "Globe",
  automation: "Workflow",
  ai: "Brain",
  infra: "Server",
  other: "Folder",
};

// 카테고리 색상
export const CATEGORY_COLORS: Record<ProjectCategory, string> = {
  web: "from-blue-500 to-cyan-500",
  automation: "from-orange-500 to-amber-500",
  ai: "from-purple-500 to-pink-500",
  infra: "from-green-500 to-emerald-500",
  other: "from-gray-500 to-slate-500",
};

// 상태 레이블
export const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "활성",
  completed: "완료",
  archived: "보관됨",
  planned: "계획됨",
};

// 상태 색상
export const STATUS_COLORS: Record<ProjectStatus, string> = {
  active: "bg-green-500",
  completed: "bg-blue-500",
  archived: "bg-gray-500",
  planned: "bg-yellow-500",
};

// ========== Zod 스키마 ==========

// 기술 스택 스키마
const techStackSchema = z.object({
  name: z.string().min(1, "기술 이름은 필수입니다"),
  icon: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
});

// 프로젝트 링크 스키마
const projectLinkSchema = z.object({
  type: z.enum(["github", "demo", "docs", "api", "other"]),
  url: z.string().url("유효한 URL을 입력하세요"),
  label: z.string().optional(),
});

// 프로젝트 이미지 스키마
const projectImageSchema = z.object({
  src: z.string().min(1, "이미지 경로는 필수입니다"),
  alt: z.string().min(1, "이미지 설명은 필수입니다"),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  isPrimary: z.boolean().optional(),
});

// 프로젝트 생성 스키마 (id 제외)
export const createProjectSchema = z.object({
  slug: z
    .string()
    .min(1, "슬러그는 필수입니다")
    .regex(/^[a-z0-9-]+$/, "슬러그는 소문자, 숫자, 하이픈만 허용됩니다"),
  name: z.string().min(1, "프로젝트 이름은 필수입니다"),
  description: z.string().min(1, "설명은 필수입니다"),
  longDescription: z.string().optional(),
  category: z.enum(["web", "automation", "ai", "infra", "other"]),
  status: z.enum(["active", "completed", "archived", "planned"]),
  techStack: z.array(techStackSchema).default([]),
  links: z.array(projectLinkSchema).default([]),
  images: z.array(projectImageSchema).default([]),
  features: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  featured: z.boolean().optional().default(false),
  order: z.number().optional(),
});

// 프로젝트 수정 스키마 (모든 필드 optional)
export const updateProjectSchema = z.object({
  slug: z
    .string()
    .min(1, "슬러그는 필수입니다")
    .regex(/^[a-z0-9-]+$/, "슬러그는 소문자, 숫자, 하이픈만 허용됩니다")
    .optional(),
  name: z.string().min(1, "프로젝트 이름은 필수입니다").optional(),
  description: z.string().min(1, "설명은 필수입니다").optional(),
  longDescription: z.string().optional(),
  category: z.enum(["web", "automation", "ai", "infra", "other"]).optional(),
  status: z.enum(["active", "completed", "archived", "planned"]).optional(),
  techStack: z.array(techStackSchema).optional(),
  links: z.array(projectLinkSchema).optional(),
  images: z.array(projectImageSchema).optional(),
  features: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  featured: z.boolean().optional(),
  order: z.number().optional(),
});

// 입력 타입 추론
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

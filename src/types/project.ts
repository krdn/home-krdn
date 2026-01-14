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

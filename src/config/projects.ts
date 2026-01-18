import type { Project, ProjectCategory } from "@/types/project";

export const projects: Project[] = [
  // ========== Web Projects ==========
  {
    id: "home-krdn",
    slug: "home-krdn",
    name: "Home KRDN",
    description: "개인 홈서버 대시보드 및 프로젝트 갤러리",
    longDescription:
      "Next.js 16과 React 19를 기반으로 구축된 개인 홈서버 관리 대시보드입니다. 실시간 시스템 모니터링, Docker 컨테이너 관리, 서비스 상태 확인, 프로젝트 갤러리 등의 기능을 제공합니다.",
    category: "web",
    status: "active",
    techStack: [
      { name: "Next.js 16", icon: "nextjs", url: "https://nextjs.org" },
      { name: "React 19", icon: "react", url: "https://react.dev" },
      { name: "TypeScript", icon: "typescript", url: "https://typescriptlang.org" },
      { name: "Tailwind CSS", icon: "tailwindcss", url: "https://tailwindcss.com" },
      { name: "Framer Motion", icon: "framer", url: "https://framer.com/motion" },
    ],
    links: [
      { type: "github", url: "https://github.com/krdn/home-krdn", label: "GitHub" },
      { type: "demo", url: "https://all.krdn.kr", label: "Live Demo" },
    ],
    images: [
      {
        src: "/images/projects/home-krdn-dashboard.svg",
        alt: "Home KRDN 대시보드 메인 화면",
        isPrimary: true,
      },
      {
        src: "/images/projects/home-krdn-services.svg",
        alt: "서비스 관리 화면",
      },
    ],
    features: [
      "실시간 시스템 리소스 모니터링 (CPU, Memory, Disk)",
      "Docker 컨테이너 상태 관리",
      "서비스별 상세 정보 및 링크 제공",
      "반응형 디자인 및 다크 모드 지원",
      "프로젝트 갤러리 및 포트폴리오",
    ],
    startDate: "2024-12-01",
    featured: true,
    order: 1,
  },

  // ========== Automation Projects ==========
  {
    id: "docker-n8n",
    slug: "docker-n8n",
    name: "Docker n8n Environment",
    description: "n8n 워크플로우 자동화를 위한 Docker 환경 구성",
    longDescription:
      "n8n 자동화 플랫폼을 위한 완전한 Docker Compose 환경입니다. PostgreSQL, Redis, n8n 메인 및 워커 노드를 포함하며, 프로덕션 레디 설정을 제공합니다.",
    category: "automation",
    status: "active",
    techStack: [
      { name: "Docker", icon: "docker", url: "https://docker.com" },
      { name: "Docker Compose", icon: "docker" },
      { name: "n8n", icon: "n8n", url: "https://n8n.io" },
      { name: "PostgreSQL", icon: "postgresql", url: "https://postgresql.org" },
      { name: "Redis", icon: "redis", url: "https://redis.io" },
      { name: "Nginx", icon: "nginx", url: "https://nginx.org" },
    ],
    links: [
      { type: "github", url: "https://github.com/krdn/docker-n8n", label: "GitHub" },
      { type: "demo", url: "https://n8n.krdn.kr", label: "n8n Instance" },
      { type: "docs", url: "https://docs.n8n.io", label: "n8n Docs" },
    ],
    images: [
      {
        src: "/images/projects/docker-n8n-workflow.svg",
        alt: "n8n 워크플로우 편집기",
        isPrimary: true,
      },
    ],
    features: [
      "Docker Compose 기반 원클릭 배포",
      "PostgreSQL 데이터 영속성",
      "Redis 기반 큐 시스템",
      "워커 노드 스케일링 지원",
      "Nginx 리버스 프록시 및 SSL",
      "자동 백업 스크립트 포함",
    ],
    startDate: "2024-06-01",
    featured: false,
    order: 2,
  },

  // ========== AI Projects ==========
  {
    id: "ai-note-taking",
    slug: "ai-note-taking",
    name: "AI Note Taking",
    description: "AI 기반 스마트 노트 작성 애플리케이션",
    longDescription:
      "TipTap 에디터와 Claude API를 활용한 지능형 노트 작성 앱입니다. AI 자동 완성, 요약, 번역 등의 기능을 통해 효율적인 노트 작성을 지원합니다. Prisma를 사용한 데이터 영속성을 제공합니다.",
    category: "ai",
    status: "active",
    techStack: [
      { name: "Next.js", icon: "nextjs", url: "https://nextjs.org" },
      { name: "TypeScript", icon: "typescript" },
      { name: "TipTap", icon: "tiptap", url: "https://tiptap.dev" },
      { name: "Claude API", icon: "anthropic", url: "https://anthropic.com" },
      { name: "Prisma", icon: "prisma", url: "https://prisma.io" },
      { name: "SQLite", icon: "sqlite" },
    ],
    links: [
      { type: "github", url: "https://github.com/krdn/ai-note-taking", label: "GitHub" },
    ],
    images: [
      {
        src: "/images/projects/ai-note-editor.svg",
        alt: "AI 노트 에디터 화면",
        isPrimary: true,
      },
    ],
    features: [
      "AI 기반 텍스트 자동 완성",
      "리치 텍스트 에디터 (TipTap)",
      "마크다운 지원",
      "코드 하이라이팅",
      "태스크 리스트 및 체크박스",
      "AI 요약 및 번역 기능",
    ],
    startDate: "2024-09-01",
    featured: true,
    order: 3,
  },

  // ========== Infrastructure Projects ==========
  {
    id: "krdn-claude",
    slug: "krdn-claude",
    name: "KRDN Claude Framework",
    description: "Claude Code 기반 AI 오케스트레이터 프레임워크",
    longDescription:
      "트리 구조 에이전트 시스템으로 AI, N8N, Web 프로젝트를 통합 관리하는 프레임워크입니다. 시스템 점검, 배포, 문서화 등 다양한 자동화 기능을 제공합니다.",
    category: "infra",
    status: "active",
    techStack: [
      { name: "TypeScript", icon: "typescript" },
      { name: "Claude API", icon: "anthropic" },
      { name: "Node.js", icon: "nodejs" },
      { name: "Bash", icon: "bash" },
    ],
    links: [
      { type: "github", url: "https://github.com/krdn/krdn-claude", label: "GitHub" },
      { type: "docs", url: "https://github.com/krdn/krdn-claude/wiki", label: "Wiki" },
    ],
    images: [
      {
        src: "/images/projects/krdn-claude-diagram.svg",
        alt: "KRDN Claude 아키텍처 다이어그램",
        isPrimary: true,
      },
    ],
    features: [
      "트리 구조 에이전트 시스템",
      "프로젝트 오케스트레이션",
      "시스템 상태 점검 자동화",
      "배포 관리 및 롤백",
      "자동 문서화 (ADR 생성)",
      "컨텍스트 저장 및 복원",
    ],
    startDate: "2024-11-01",
    featured: false,
    order: 4,
  },

  // ========== Other Projects ==========
  {
    id: "news-sentiment-analyzer",
    slug: "news-sentiment-analyzer",
    name: "News Sentiment Analyzer",
    description: "뉴스 기사 감정 분석 시스템",
    longDescription:
      "뉴스 기사를 자동 수집하고 AI를 통해 감정을 분석하여 Streamlit 대시보드로 시각화합니다. Celery 기반 비동기 처리를 지원하여 대량의 기사를 효율적으로 처리합니다.",
    category: "ai",
    status: "active",
    techStack: [
      { name: "Django", icon: "django", url: "https://djangoproject.com" },
      { name: "FastAPI", icon: "fastapi", url: "https://fastapi.tiangolo.com" },
      { name: "Celery", icon: "celery" },
      { name: "Streamlit", icon: "streamlit", url: "https://streamlit.io" },
      { name: "PostgreSQL", icon: "postgresql" },
      { name: "Redis", icon: "redis" },
    ],
    links: [
      { type: "github", url: "https://github.com/krdn/news-sentiment-analyzer", label: "GitHub" },
      { type: "demo", url: "https://news.krdn.kr", label: "Live Demo" },
    ],
    images: [
      {
        src: "/images/projects/news-sentiment-dashboard.svg",
        alt: "뉴스 감정 분석 대시보드",
        isPrimary: true,
      },
    ],
    features: [
      "뉴스 기사 자동 수집 (크롤링)",
      "AI 기반 감정 분석 (긍정/부정/중립)",
      "Streamlit 대시보드 시각화",
      "Celery 비동기 처리",
      "시계열 트렌드 분석",
      "키워드 추출 및 워드클라우드",
    ],
    startDate: "2024-07-01",
    featured: false,
    order: 5,
  },
];

// 프로젝트 ID로 조회
export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

// 슬러그로 조회
export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

// 카테고리별 프로젝트 조회
export function getProjectsByCategory(category: ProjectCategory | "all"): Project[] {
  if (category === "all") return projects;
  return projects.filter((p) => p.category === category);
}

// Featured 프로젝트 조회
export function getFeaturedProjects(): Project[] {
  return projects.filter((p) => p.featured === true);
}

// 활성 프로젝트 조회
export function getActiveProjects(): Project[] {
  return projects.filter((p) => p.status === "active");
}

// 정렬된 프로젝트 목록 조회
export function getSortedProjects(): Project[] {
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

// 모든 카테고리 목록
export function getAllCategories(): ProjectCategory[] {
  const categories = new Set(projects.map((p) => p.category));
  return Array.from(categories);
}

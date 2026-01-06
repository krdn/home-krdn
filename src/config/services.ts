import type { Service } from "@/types/service";

export const services: Service[] = [
  // ========== AI Projects ==========
  {
    id: "ai-note-taking",
    name: "AI Note Taking",
    description: "AI 기반 스마트 노트 애플리케이션",
    longDescription:
      "TipTap 에디터와 Claude API를 활용한 지능형 노트 작성 앱. 자동 완성, 요약, 번역 등 AI 기능을 통해 효율적인 노트 작성을 지원합니다.",
    category: "ai",
    status: "stopped",
    techStack: ["Next.js", "Prisma", "TipTap", "Claude API", "TypeScript"],
    path: "/data/home-data/projects/ai/ai-note-taking",
    features: [
      "AI 기반 텍스트 자동 완성",
      "리치 텍스트 에디터 (TipTap)",
      "코드 하이라이팅",
      "태스크 리스트 및 체크박스",
      "Prisma 기반 데이터 저장",
    ],
    containers: [],
    icon: "FileText",
  },
  {
    id: "claude-code-auto",
    name: "Claude Code Auto",
    description: "Claude 기반 자동화 코드 생성 도구",
    longDescription:
      "AI Orchestrator Framework. Claude API를 활용하여 자동으로 코드를 생성하고 관리하는 도구입니다.",
    category: "ai",
    status: "stopped",
    techStack: ["TypeScript", "Node.js", "Claude API", "Jest"],
    path: "/data/home-data/projects/ai/claude-code-auto",
    features: [
      "AI 기반 코드 생성",
      "CLI 인터페이스",
      "Git 통합",
      "테스트 자동화",
    ],
    containers: [],
    icon: "Code",
  },
  {
    id: "linkedin",
    name: "LinkedIn Automation",
    description: "PDF 이력서에서 LinkedIn 프로필 자동 입력",
    longDescription:
      "FastAPI 백엔드와 Chrome 확장 프로그램을 통해 PDF 이력서의 정보를 LinkedIn 프로필에 자동으로 입력합니다.",
    category: "ai",
    status: "stopped",
    techStack: ["FastAPI", "Python", "LangChain", "Chrome Extension", "OpenAI"],
    port: 8000,
    path: "/data/home-data/projects/ai/linkedin",
    features: [
      "PDF 이력서 파싱",
      "LinkedIn 자동 입력",
      "Chrome 확장 프로그램",
      "LangChain 통합",
    ],
    containers: [],
    icon: "Linkedin",
  },
  {
    id: "recursive-language-model",
    name: "Recursive Language Model",
    description: "재귀적 언어 모델 연구 프로젝트",
    longDescription:
      "언어 모델의 재귀적 특성을 연구하는 실험 프로젝트입니다.",
    category: "ai",
    status: "stopped",
    techStack: ["Python", "PyTorch"],
    path: "/data/home-data/projects/ai/recursive-language-model",
    features: ["언어 모델 연구", "실험적 아키텍처"],
    containers: [],
    icon: "FlaskConical",
  },

  // ========== n8n Projects ==========
  {
    id: "gonsai2",
    name: "Gonsai2",
    description: "AI 최적화 n8n 워크플로우 관리 플랫폼",
    longDescription:
      "n8n 워크플로우를 시각화하고 AI 기반으로 최적화하는 풀스택 웹 애플리케이션. 실시간 모니터링과 분석 대시보드를 제공합니다.",
    category: "n8n",
    status: "running",
    techStack: ["Next.js", "Node.js", "MongoDB", "TypeScript", "Docker"],
    port: 8081,
    path: "/data/home-data/projects/n8n/gonsai2",
    url: "http://localhost:8081",
    features: [
      "n8n 워크플로우 시각화",
      "실시간 실행 모니터링",
      "AI 기반 최적화 제안",
      "대시보드 분석",
      "MongoDB 데이터 저장",
    ],
    containers: [
      "gonsai2-frontend",
      "gonsai2-backend",
      "gonsai2-mongodb-prod",
      "gonsai2-nginx",
    ],
    icon: "LayoutDashboard",
  },
  {
    id: "n8n-agent-generator",
    name: "n8n Agent Generator",
    description: "프롬프트 기반 n8n AI Agent 워크플로우 생성",
    longDescription:
      "CLI 도구로 자연어 프롬프트를 입력하면 n8n AI Agent 워크플로우를 자동으로 생성합니다.",
    category: "n8n",
    status: "stopped",
    techStack: ["TypeScript", "Node.js", "Claude API", "Commander"],
    path: "/data/home-data/projects/n8n/n8n-agent-generator",
    features: [
      "프롬프트 기반 워크플로우 생성",
      "n8n 호환 JSON 출력",
      "대화형 CLI 인터페이스",
    ],
    containers: [],
    icon: "Wand2",
  },
  {
    id: "news-sentiment-analyzer",
    name: "News Sentiment Analyzer",
    description: "뉴스 기사 감정 분석 시스템",
    longDescription:
      "뉴스 기사를 수집하고 감정을 분석하여 Streamlit 대시보드로 시각화합니다. Celery 기반 비동기 처리를 지원합니다.",
    category: "n8n",
    status: "running",
    techStack: ["Django", "FastAPI", "Celery", "Streamlit", "PostgreSQL", "Redis"],
    port: 3010,
    path: "/data/home-data/projects/n8n/news-sentiment-analyzer2",
    url: "http://localhost:3010",
    features: [
      "뉴스 기사 자동 수집",
      "감정 분석 (긍정/부정/중립)",
      "Streamlit 대시보드",
      "Celery 비동기 처리",
      "시계열 트렌드 분석",
    ],
    containers: [
      "news-prod-app",
      "news-prod-worker",
      "news-prod-beat",
      "news-postgres",
      "news-prod-redis",
    ],
    icon: "Newspaper",
  },
  {
    id: "n8n",
    name: "n8n",
    description: "워크플로우 자동화 플랫폼",
    longDescription:
      "400개 이상의 앱 통합을 지원하는 오픈소스 워크플로우 자동화 플랫폼. AI Agent 기능을 포함합니다.",
    category: "n8n",
    status: "running",
    techStack: ["Node.js", "TypeScript", "PostgreSQL", "Redis"],
    port: 5678,
    url: "http://localhost:5678",
    features: [
      "400+ 앱 통합",
      "시각적 워크플로우 빌더",
      "AI Agent 지원",
      "Webhook 트리거",
      "스케줄 실행",
    ],
    containers: ["n8n", "n8n-worker", "n8n-postgres", "n8n-redis"],
    icon: "Workflow",
  },

  // ========== Infrastructure ==========
  {
    id: "open-webui",
    name: "Open WebUI",
    description: "LLM 웹 인터페이스",
    longDescription:
      "다양한 AI 모델을 웹 인터페이스로 사용할 수 있는 플랫폼. 대화 내역 관리와 RAG 기능을 지원합니다.",
    category: "infrastructure",
    status: "running",
    techStack: ["Python", "Svelte", "FastAPI"],
    port: 8088,
    url: "http://localhost:8088",
    features: [
      "멀티 모델 지원",
      "대화 내역 관리",
      "RAG (문서 검색 증강)",
      "커스텀 프롬프트",
    ],
    containers: ["open-webui"],
    icon: "MessageSquare",
  },
  {
    id: "code-server",
    name: "Code Server",
    description: "브라우저 기반 VS Code 환경",
    longDescription:
      "브라우저에서 VS Code를 실행할 수 있는 원격 개발 환경. 확장 프로그램도 지원합니다.",
    category: "infrastructure",
    status: "running",
    techStack: ["Node.js", "TypeScript"],
    port: 8080,
    url: "http://localhost:8080",
    features: [
      "브라우저 기반 IDE",
      "VS Code 확장 지원",
      "원격 개발 환경",
      "멀티 터미널",
    ],
    containers: ["vscode"],
    icon: "Terminal",
  },
  {
    id: "telegram-bot",
    name: "Telegram Bot",
    description: "텔레그램 알림 봇",
    longDescription:
      "시스템 알림과 자동화 메시지를 텔레그램으로 전송하는 봇 서비스입니다.",
    category: "infrastructure",
    status: "running",
    techStack: ["Python", "python-telegram-bot"],
    path: "/data/home-data/projects",
    features: ["시스템 알림", "자동화 메시지", "명령어 처리"],
    containers: [],
    icon: "Send",
  },
];

export function getServiceById(id: string): Service | undefined {
  return services.find((s) => s.id === id);
}

export function getServicesByCategory(category: string): Service[] {
  if (category === "all") return services;
  return services.filter((s) => s.category === category);
}

export function getRunningServices(): Service[] {
  return services.filter((s) => s.status === "running");
}

export function getFeaturedServices(): Service[] {
  return services.filter((s) => s.status === "running").slice(0, 3);
}

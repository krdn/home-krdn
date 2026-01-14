import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ExternalLink,
  Github,
  FileText,
  Globe,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { projects, getProjectBySlug } from "@/config/projects";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { ProjectLink } from "@/types/project";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/types/project";
import { getIcon } from "@/lib/icons";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// 정적 생성 파라미터
export async function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

// 메타데이터 생성
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Project Not Found" };

  return {
    title: `${project.name} - krdn`,
    description: project.description,
  };
}

// 링크 타입별 아이콘 매핑
const linkIcons: Record<ProjectLink["type"], typeof Github> = {
  github: Github,
  demo: Globe,
  docs: FileText,
  api: FileText,
  other: ExternalLink,
};

// 링크 타입별 레이블 매핑
const linkLabels: Record<ProjectLink["type"], string> = {
  github: "GitHub",
  demo: "Live Demo",
  docs: "Documentation",
  api: "API Docs",
  other: "Link",
};

// 기술 스택 색상 매핑
const techColors: Record<string, string> = {
  "Next.js": "bg-black text-white dark:bg-white dark:text-black",
  "Next.js 16": "bg-black text-white dark:bg-white dark:text-black",
  React: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400",
  "React 19": "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400",
  TypeScript: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  "Tailwind CSS": "bg-teal-500/20 text-teal-600 dark:text-teal-400",
  Docker: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  "Docker Compose": "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  PostgreSQL: "bg-blue-600/20 text-blue-600 dark:text-blue-400",
  Redis: "bg-red-500/20 text-red-600 dark:text-red-400",
  n8n: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  Nginx: "bg-green-500/20 text-green-600 dark:text-green-400",
  "Claude API": "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  Prisma: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
  TipTap: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  Django: "bg-green-600/20 text-green-600 dark:text-green-500",
  FastAPI: "bg-teal-500/20 text-teal-600 dark:text-teal-400",
  Celery: "bg-lime-500/20 text-lime-600 dark:text-lime-400",
  Streamlit: "bg-red-500/20 text-red-600 dark:text-red-400",
  "Node.js": "bg-green-500/20 text-green-600 dark:text-green-400",
  Bash: "bg-gray-500/20 text-gray-600 dark:text-gray-400",
  "Framer Motion": "bg-pink-500/20 text-pink-600 dark:text-pink-400",
  SQLite: "bg-blue-400/20 text-blue-600 dark:text-blue-400",
};

// 날짜 포맷 함수
function formatDate(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  // 카테고리 아이콘
  const CategoryIcon = getIcon(CATEGORY_ICONS[project.category]);

  // 프라이머리 이미지와 나머지 이미지 분리
  const primaryImage =
    project.images.find((img) => img.isPrimary) || project.images[0];
  const otherImages = project.images.filter((img) => img !== primaryImage);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 뒤로가기 버튼 */}
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br",
                CATEGORY_COLORS[project.category].replace(
                  "from-",
                  "from-"
                ).split(" ")[0] + "/20",
                CATEGORY_COLORS[project.category].split(" ")[1] + "/20"
              )}
            >
              <CategoryIcon className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold sm:text-3xl">
                  {project.name}
                </h1>
                {/* Featured 배지 */}
                {project.featured && (
                  <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    Featured
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-3">
                <span
                  className={cn(
                    "bg-gradient-to-r bg-clip-text text-transparent",
                    CATEGORY_COLORS[project.category]
                  )}
                >
                  {CATEGORY_LABELS[project.category]}
                </span>
                {/* 상태 배지 */}
                <div
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2 py-0.5",
                    `${STATUS_COLORS[project.status]}/20`
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      STATUS_COLORS[project.status],
                      project.status === "active" && "animate-pulse"
                    )}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {STATUS_LABELS[project.status]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 링크 버튼들 */}
          <div className="flex flex-wrap gap-2">
            {project.links.map((link) => {
              const LinkIcon = linkIcons[link.type];
              return (
                <Button
                  key={link.url}
                  asChild
                  variant={link.type === "demo" ? "default" : "outline"}
                  className="gap-2"
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LinkIcon className="h-4 w-4" />
                    {link.label || linkLabels[link.type]}
                  </a>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 메인 이미지 */}
      {primaryImage && (
        <Card className="mb-6 overflow-hidden">
          <div className="relative aspect-video w-full">
            <Image
              src={primaryImage.src}
              alt={primaryImage.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          </div>
        </Card>
      )}

      {/* 설명 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {project.longDescription || project.description}
          </p>
        </CardContent>
      </Card>

      {/* 정보 그리드 */}
      <div className="mb-6 grid gap-6 sm:grid-cols-2">
        {/* 기술 스택 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tech Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <a
                  key={tech.name}
                  href={tech.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center rounded-md px-2 py-1 text-sm font-medium transition-opacity",
                    techColors[tech.name] || "bg-secondary text-secondary-foreground",
                    tech.url && "hover:opacity-80"
                  )}
                >
                  {tech.name}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 프로젝트 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.startDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">시작일:</span>
                <span>{formatDate(project.startDate)}</span>
              </div>
            )}
            {project.endDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">종료일:</span>
                <span>{formatDate(project.endDate)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">상태:</span>
              <span>{STATUS_LABELS[project.status]}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 주요 기능 */}
      {project.features && project.features.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {project.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 추가 이미지 갤러리 */}
      {otherImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gallery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {otherImages.map((image, index) => (
                <div
                  key={index}
                  className="relative aspect-video overflow-hidden rounded-lg"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

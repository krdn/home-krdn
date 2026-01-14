"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Github, FileText, Globe } from "lucide-react";
import { ProjectImage } from "./ProjectImage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Project, ProjectLink } from "@/types/project";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/types/project";

interface ProjectCardProps {
  project: Project;
  showControls?: boolean;
}

// 링크 타입별 아이콘 매핑
const linkIcons: Record<ProjectLink["type"], typeof Github> = {
  github: Github,
  demo: Globe,
  docs: FileText,
  api: FileText,
  other: ExternalLink,
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
  "Docker Compose": "bg-blue-500/20 text-blue-600 dark:text-blue-400",
};

function ProjectCardComponent({ project, showControls = true }: ProjectCardProps) {
  const router = useRouter();

  // 프라이머리 이미지 찾기
  const primaryImage =
    project.images.find((img) => img.isPrimary) || project.images[0];

  // GitHub와 Demo 링크 분리
  const githubLink = project.links.find((link) => link.type === "github");
  const demoLink = project.links.find((link) => link.type === "demo");

  // 카드 클릭 시 상세 페이지로 이동
  const handleCardClick = () => {
    router.push(`/projects/${project.slug}`);
  };

  // 외부 링크 클릭 시 이벤트 버블링 방지
  const handleExternalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      hover
      onClick={handleCardClick}
      className={cn(
        "flex flex-col h-full overflow-hidden cursor-pointer",
        // featured 프로젝트 테두리 강조
        project.featured && "ring-2 ring-primary/50"
      )}
    >
      {/* 썸네일 이미지 */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <ProjectImage
          src={primaryImage?.src || ""}
          alt={primaryImage?.alt || project.name}
          fill
          objectFit="cover"
          fallbackCategory={project.category}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        {/* Featured 배지 */}
        {project.featured && (
          <div className="absolute top-2 left-2 z-10 rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            Featured
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{project.name}</CardTitle>
            <div className="mt-1 flex items-center gap-2">
              {/* 카테고리 배지 */}
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                  `bg-gradient-to-r ${CATEGORY_COLORS[project.category]} bg-clip-text text-transparent`
                )}
              >
                {CATEGORY_LABELS[project.category]}
              </span>
            </div>
          </div>
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
      </CardHeader>

      <CardContent className="flex flex-1 flex-col pt-0">
        {/* 설명 */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>

        {/* 기술 스택 (최대 5개) */}
        <div className="mt-3 flex flex-wrap gap-1">
          {project.techStack.slice(0, 5).map((tech) => (
            <span
              key={tech.name}
              className={cn(
                "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium",
                techColors[tech.name] || "bg-secondary text-secondary-foreground"
              )}
            >
              {tech.name}
            </span>
          ))}
          {project.techStack.length > 5 && (
            <span className="px-1.5 py-0.5 text-xs text-muted-foreground">
              +{project.techStack.length - 5}
            </span>
          )}
        </div>

        {/* 컨트롤 버튼 */}
        {showControls && (
          <div className="mt-auto flex items-center gap-2 pt-4">
            <span className="flex-1 inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              상세 보기
            </span>
            <div className="flex gap-1" onClick={handleExternalClick}>
              {githubLink && (
                <Button asChild variant="ghost" size="sm">
                  <a
                    href={githubLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="GitHub"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {demoLink && (
                <Button asChild variant="ghost" size="sm">
                  <a
                    href={demoLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Demo"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// React.memo로 최적화
export const ProjectCard = memo(ProjectCardComponent);

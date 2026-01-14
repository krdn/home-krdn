"use client";

import { memo } from "react";
import { ProjectCard } from "./ProjectCard";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Project, ProjectCategory } from "@/types/project";
import { CATEGORY_LABELS } from "@/types/project";
import { cn } from "@/lib/utils";

interface ProjectGridProps {
  projects: Project[];
  selectedCategory?: ProjectCategory | "all";
  onCategoryChange?: (category: ProjectCategory | "all") => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

// 카테고리 탭 목록
const categories: Array<{ id: ProjectCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "web", label: "Web" },
  { id: "automation", label: "Automation" },
  { id: "ai", label: "AI" },
  { id: "infra", label: "Infra" },
  { id: "other", label: "Other" },
];

// 로딩 스켈레톤 컴포넌트
function ProjectCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
      {/* 썸네일 스켈레톤 */}
      <Skeleton className="aspect-video w-full" />
      {/* 헤더 스켈레톤 */}
      <div className="p-6 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-2 h-4 w-16" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
      {/* 콘텐츠 스켈레톤 */}
      <div className="px-6 pb-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
        <div className="mt-3 flex gap-1">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-5 w-14 rounded-md" />
        </div>
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function ProjectGridComponent({
  projects,
  selectedCategory = "all",
  onCategoryChange,
  isLoading = false,
  emptyMessage = "프로젝트가 없습니다",
}: ProjectGridProps) {
  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* 카테고리 탭 스켈레톤 */}
        {onCategoryChange && (
          <div className="flex items-center gap-1 rounded-lg border p-1">
            {categories.map((cat) => (
              <Skeleton key={cat.id} className="h-8 w-16 rounded-md" />
            ))}
          </div>
        )}
        {/* 그리드 스켈레톤 */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // 빈 상태
  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        {/* 카테고리 탭 */}
        {onCategoryChange && (
          <CategoryTabs
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
          />
        )}
        {/* 빈 상태 메시지 */}
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 카테고리 탭 */}
      {onCategoryChange && (
        <CategoryTabs
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
        />
      )}

      {/* 프로젝트 그리드 */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

// 카테고리 탭 컴포넌트
interface CategoryTabsProps {
  selectedCategory: ProjectCategory | "all";
  onCategoryChange: (category: ProjectCategory | "all") => void;
}

function CategoryTabs({ selectedCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border p-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export const ProjectGrid = memo(ProjectGridComponent);

"use client";

import { useState, useMemo } from "react";
import { Search, X, Star } from "lucide-react";
import { projects, getProjectsByCategory, getFeaturedProjects } from "@/config/projects";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { Button } from "@/components/ui/Button";
import type { ProjectCategory } from "@/types/project";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  // 필터링된 프로젝트 목록
  const filteredProjects = useMemo(() => {
    let result = getProjectsByCategory(selectedCategory);

    // 검색어 필터링
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.techStack.some((t) => t.name.toLowerCase().includes(query))
      );
    }

    // Featured 필터링
    if (showFeaturedOnly) {
      result = result.filter((p) => p.featured === true);
    }

    // order 기준 정렬
    return result.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [selectedCategory, searchQuery, showFeaturedOnly]);

  // 통계
  const featuredCount = getFeaturedProjects().length;
  const activeCount = projects.filter((p) => p.status === "active").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold sm:text-4xl">Projects</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {projects.length}개의 프로젝트 중 {activeCount}개 활성 중
        </p>
      </div>

      {/* 필터 */}
      <div className="mb-8 space-y-4">
        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="프로젝트 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:max-w-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Featured 필터 버튼 */}
        <div className="flex items-center gap-2">
          <Button
            variant={showFeaturedOnly ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
            className="gap-2"
          >
            <Star className={cn("h-4 w-4", showFeaturedOnly && "fill-current")} />
            Featured only ({featuredCount})
          </Button>
        </div>
      </div>

      {/* 결과 */}
      <ProjectGrid
        projects={filteredProjects}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        emptyMessage="검색 결과가 없습니다"
      />
    </div>
  );
}

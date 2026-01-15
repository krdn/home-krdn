"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Plus, Pencil, Trash2, Star, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

// Dynamic Import: ProjectForm은 802줄의 큰 컴포넌트이므로 지연 로딩
const ProjectForm = dynamic(
  () => import("@/components/admin/ProjectForm").then((mod) => mod.ProjectForm),
  {
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 rounded-lg bg-card p-4 shadow-lg">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>폼 로딩 중...</span>
        </div>
      </div>
    ),
    ssr: false, // 모달은 클라이언트에서만 필요
  }
);
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  type Project,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "@/types/project";
import { cn } from "@/lib/utils";

/**
 * Admin 프로젝트 관리 페이지
 * 프로젝트 CRUD 기능을 제공하는 관리 페이지입니다.
 */

export default function AdminProjectsPage() {
  // 프로젝트 목록 상태
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 폼 다이얼로그 상태
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();

  // 삭제 확인 상태
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 토스트 상태 (간단한 알림)
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // 토스트 표시 헬퍼
  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    []
  );

  // 프로젝트 목록 가져오기
  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/projects");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "프로젝트 조회 실패");
      }

      setProjects(data.projects);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "프로젝트를 불러오는데 실패했습니다"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 프로젝트 로드
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // 새 프로젝트 생성 다이얼로그 열기
  const handleCreate = () => {
    setEditingProject(undefined);
    setFormOpen(true);
  };

  // 프로젝트 수정 다이얼로그 열기
  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormOpen(true);
  };

  // 프로젝트 삭제
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "삭제 실패");
      }

      showToast("프로젝트가 삭제되었습니다", "success");
      fetchProjects();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "삭제에 실패했습니다",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (data: CreateProjectInput | UpdateProjectInput) => {
    const isEditing = !!editingProject;

    try {
      const url = isEditing
        ? `/api/projects/${editingProject.id}`
        : "/api/projects";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "저장 실패");
      }

      showToast(
        isEditing
          ? "프로젝트가 수정되었습니다"
          : "프로젝트가 생성되었습니다",
        "success"
      );
      fetchProjects();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "저장에 실패했습니다",
        "error"
      );
      throw err; // 폼 에러 처리를 위해 다시 throw
    }
  };

  return (
    <div className="space-y-6">
      {/* 토스트 알림 */}
      {toast && (
        <div
          className={cn(
            "fixed right-4 top-4 z-50 rounded-lg px-4 py-3 shadow-lg transition-all",
            toast.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          )}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Projects</h1>
          <p className="mt-1 text-muted-foreground">
            프로젝트 관리 및 CRUD 작업
          </p>
        </div>

        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          새 프로젝트
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {/* Projects List */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">
                  등록된 프로젝트가 없습니다
                </p>
                <Button onClick={handleCreate} variant="outline" className="mt-4">
                  첫 프로젝트 만들기
                </Button>
              </CardContent>
            </Card>
          ) : (
            projects.map((project) => (
              <Card key={project.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Project Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {project.featured && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        )}
                        <h3 className="text-lg font-semibold">
                          {project.name}
                        </h3>
                        <Badge variant="outline">
                          {CATEGORY_LABELS[project.category]}
                        </Badge>
                        <Badge
                          className={cn(
                            "text-white",
                            STATUS_COLORS[project.status]
                          )}
                        >
                          {STATUS_LABELS[project.status]}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {project.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">/{project.slug}</span>
                        {project.order !== undefined && (
                          <span>| Order: {project.order}</span>
                        )}
                        {project.techStack.length > 0 && (
                          <span>
                            | Tech: {project.techStack.map((t) => t.name).join(", ")}
                          </span>
                        )}
                      </div>

                      {/* Links */}
                      {project.links.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {project.links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs hover:bg-secondary/80"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {link.label || link.type}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(project)}
                        className="gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        수정
                      </Button>

                      {deletingId === project.id ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(project.id)}
                          >
                            확인
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingId(null)}
                          >
                            취소
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingId(project.id)}
                          className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                          삭제
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Project Form Dialog */}
      <ProjectForm
        project={editingProject}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import {
  FolderSearch,
  RefreshCw,
  Check,
  X,
  FileCode,
  GitBranch,
  FileText,
  Import,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CATEGORY_LABELS, type ProjectCategory } from "@/types/project";
import { cn } from "@/lib/utils";

/**
 * 프로젝트 스캐너 컴포넌트
 * 파일시스템에서 프로젝트를 스캔하고 선택적으로 등록합니다.
 */

// 스캔된 프로젝트 타입
interface ScannedProject {
  path: string;
  name: string;
  description?: string;
  gitRemote?: string;
  hasPackageJson: boolean;
  hasReadme: boolean;
  isRegistered: boolean;
  suggestedCategory?: ProjectCategory;
  suggestedSlug?: string;
}

// 스캔 응답 타입
interface ScanResponse {
  success: boolean;
  basePath?: string;
  projects?: ScannedProject[];
  total?: number;
  registered?: number;
  unregistered?: number;
  allowedPaths?: string[];
  error?: string;
}

// 임포트 응답 타입
interface ImportResponse {
  success: boolean;
  project?: { id: string; name: string; slug: string };
  error?: string;
}

interface ProjectScannerProps {
  onImportSuccess?: () => void;
}

export function ProjectScanner({ onImportSuccess }: ProjectScannerProps) {
  // 스캔 경로
  const [basePath, setBasePath] = useState("/home/gon/projects");

  // 스캔 상태
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedProjects, setScannedProjects] = useState<ScannedProject[]>([]);
  const [scanStats, setScanStats] = useState<{
    total: number;
    registered: number;
    unregistered: number;
  } | null>(null);

  // 선택 상태
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  // 임포트 상태
  const [isImporting, setIsImporting] = useState(false);
  const [importingPath, setImportingPath] = useState<string | null>(null);

  // 알림 상태
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // 알림 표시
  const showNotification = useCallback(
    (message: string, type: "success" | "error") => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
    },
    []
  );

  // 프로젝트 스캔
  const handleScan = useCallback(async () => {
    setIsScanning(true);
    setScanError(null);
    setScannedProjects([]);
    setScanStats(null);
    setSelectedPaths(new Set());

    try {
      const response = await fetch(
        `/api/projects/scan?basePath=${encodeURIComponent(basePath)}`
      );
      const data: ScanResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "스캔에 실패했습니다");
      }

      setScannedProjects(data.projects || []);
      setScanStats({
        total: data.total || 0,
        registered: data.registered || 0,
        unregistered: data.unregistered || 0,
      });
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "스캔 중 오류 발생");
    } finally {
      setIsScanning(false);
    }
  }, [basePath]);

  // 선택 토글
  const toggleSelection = useCallback((path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // 전체 선택 / 해제 (등록되지 않은 것만)
  const toggleSelectAll = useCallback(() => {
    const unregisteredPaths = scannedProjects
      .filter((p) => !p.isRegistered)
      .map((p) => p.path);

    if (selectedPaths.size === unregisteredPaths.length) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(unregisteredPaths));
    }
  }, [scannedProjects, selectedPaths.size]);

  // 단일 프로젝트 임포트
  const importProject = useCallback(
    async (project: ScannedProject) => {
      setImportingPath(project.path);
      setIsImporting(true);

      try {
        const response = await fetch("/api/projects/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: project.path,
            overrides: {
              category: project.suggestedCategory,
            },
          }),
        });

        const data: ImportResponse = await response.json();

        if (!data.success) {
          throw new Error(data.error || "임포트에 실패했습니다");
        }

        // 성공 시 해당 프로젝트를 등록됨으로 표시
        setScannedProjects((prev) =>
          prev.map((p) =>
            p.path === project.path ? { ...p, isRegistered: true } : p
          )
        );

        // 선택에서 제거
        setSelectedPaths((prev) => {
          const next = new Set(prev);
          next.delete(project.path);
          return next;
        });

        // 통계 업데이트
        setScanStats((prev) =>
          prev
            ? {
                ...prev,
                registered: prev.registered + 1,
                unregistered: prev.unregistered - 1,
              }
            : null
        );

        showNotification(
          `"${data.project?.name}" 프로젝트가 등록되었습니다`,
          "success"
        );
        onImportSuccess?.();
      } catch (err) {
        showNotification(
          err instanceof Error ? err.message : "임포트 실패",
          "error"
        );
      } finally {
        setImportingPath(null);
        setIsImporting(false);
      }
    },
    [onImportSuccess, showNotification]
  );

  // 선택된 프로젝트 일괄 임포트
  const importSelected = useCallback(async () => {
    const projectsToImport = scannedProjects.filter(
      (p) => selectedPaths.has(p.path) && !p.isRegistered
    );

    for (const project of projectsToImport) {
      await importProject(project);
    }
  }, [scannedProjects, selectedPaths, importProject]);

  // 경로 축약 표시
  const shortenPath = (fullPath: string) => {
    return fullPath.replace(/^\/home\/gon\/projects/, "~/projects");
  };

  return (
    <div className="space-y-6">
      {/* 알림 */}
      {notification && (
        <div
          className={cn(
            "fixed right-4 top-4 z-50 rounded-lg px-4 py-3 shadow-lg transition-all",
            notification.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          )}
        >
          {notification.message}
        </div>
      )}

      {/* 스캔 설정 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">스캔 경로</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FolderOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={basePath}
                    onChange={(e) => setBasePath(e.target.value)}
                    className="w-full rounded-md border bg-background py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="/home/gon/projects"
                  />
                </div>
                <Button
                  onClick={handleScan}
                  disabled={isScanning || !basePath}
                  className="gap-2"
                >
                  {isScanning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FolderSearch className="h-4 w-4" />
                  )}
                  스캔
                </Button>
              </div>
            </div>
          </div>

          {/* 에러 표시 */}
          {scanError && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {scanError}
            </div>
          )}

          {/* 스캔 통계 */}
          {scanStats && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1">
                <span className="font-medium">전체:</span> {scanStats.total}개
              </span>
              <span className="flex items-center gap-1 text-green-600">
                <Check className="h-4 w-4" />
                등록됨: {scanStats.registered}개
              </span>
              <span className="flex items-center gap-1 text-orange-600">
                <Import className="h-4 w-4" />
                미등록: {scanStats.unregistered}개
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 스캔된 프로젝트 목록 */}
      {scannedProjects.length > 0 && (
        <div className="space-y-4">
          {/* 헤더 및 액션 */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">스캔된 프로젝트</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {selectedPaths.size ===
                scannedProjects.filter((p) => !p.isRegistered).length
                  ? "전체 해제"
                  : "전체 선택"}
              </Button>
              {selectedPaths.size > 0 && (
                <Button
                  size="sm"
                  onClick={importSelected}
                  disabled={isImporting}
                  className="gap-2"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Import className="h-4 w-4" />
                  )}
                  선택 등록 ({selectedPaths.size})
                </Button>
              )}
            </div>
          </div>

          {/* 프로젝트 목록 */}
          <div className="space-y-2">
            {scannedProjects.map((project) => (
              <Card
                key={project.path}
                className={cn(
                  "transition-colors",
                  project.isRegistered && "opacity-60",
                  selectedPaths.has(project.path) && "border-primary"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* 체크박스 (등록되지 않은 경우만) */}
                    {!project.isRegistered && (
                      <button
                        type="button"
                        onClick={() => toggleSelection(project.path)}
                        className={cn(
                          "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                          selectedPaths.has(project.path)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/50"
                        )}
                      >
                        {selectedPaths.has(project.path) && (
                          <Check className="h-3 w-3" />
                        )}
                      </button>
                    )}

                    {/* 등록 완료 표시 */}
                    {project.isRegistered && (
                      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-500 text-white">
                        <Check className="h-3 w-3" />
                      </div>
                    )}

                    {/* 프로젝트 정보 */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{project.name}</span>

                        {project.isRegistered && (
                          <Badge className="bg-green-500 text-white">등록됨</Badge>
                        )}

                        {project.suggestedCategory && (
                          <Badge variant="outline">
                            {CATEGORY_LABELS[project.suggestedCategory]}
                          </Badge>
                        )}

                        {/* 메타데이터 아이콘 */}
                        <div className="flex items-center gap-1 text-muted-foreground">
                          {project.hasPackageJson && (
                            <span title="package.json">
                              <FileCode className="h-4 w-4" />
                            </span>
                          )}
                          {project.gitRemote && (
                            <span title="Git">
                              <GitBranch className="h-4 w-4" />
                            </span>
                          )}
                          {project.hasReadme && (
                            <span title="README">
                              <FileText className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </div>

                      {project.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {project.description}
                        </p>
                      )}

                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {shortenPath(project.path)}
                      </p>
                    </div>

                    {/* 액션 버튼 */}
                    {!project.isRegistered && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => importProject(project)}
                        disabled={isImporting && importingPath === project.path}
                        className="shrink-0 gap-2"
                      >
                        {isImporting && importingPath === project.path ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Import className="h-4 w-4" />
                        )}
                        등록
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {!isScanning && scannedProjects.length === 0 && !scanError && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderSearch className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              스캔 버튼을 눌러 프로젝트를 검색하세요
            </p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              package.json 또는 .git이 있는 폴더가 프로젝트로 인식됩니다
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

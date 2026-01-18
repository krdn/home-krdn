"use client";

import { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/Button";
import { X, FolderKanban, Plus, Trash2, ChevronDown } from "lucide-react";
import type {
  Project,
  ProjectCategory,
  ProjectStatus,
  TechStack,
  ProjectLink,
  ProjectImage,
  CreateProjectInput,
  UpdateProjectInput,
} from "@/types/project";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/types/project";

/**
 * 프로젝트 추가/수정 폼
 * Radix Dialog 기반의 프로젝트 편집 폼 컴포넌트입니다.
 */

// 카테고리 옵션
const categories: { value: ProjectCategory; label: string }[] = [
  { value: "web", label: CATEGORY_LABELS.web },
  { value: "automation", label: CATEGORY_LABELS.automation },
  { value: "ai", label: CATEGORY_LABELS.ai },
  { value: "infra", label: CATEGORY_LABELS.infra },
  { value: "other", label: CATEGORY_LABELS.other },
];

// 상태 옵션
const statuses: { value: ProjectStatus; label: string }[] = [
  { value: "active", label: STATUS_LABELS.active },
  { value: "completed", label: STATUS_LABELS.completed },
  { value: "archived", label: STATUS_LABELS.archived },
  { value: "planned", label: STATUS_LABELS.planned },
];

// 링크 타입 옵션
const linkTypes = [
  { value: "github", label: "GitHub" },
  { value: "demo", label: "Demo" },
  { value: "docs", label: "Docs" },
  { value: "api", label: "API" },
  { value: "production", label: "Production (운영)" },
  { value: "development", label: "Development (개발)" },
  { value: "other", label: "Other" },
] as const;

interface FormData {
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  category: ProjectCategory;
  status: ProjectStatus;
  featured: boolean;
  order: number;
  startDate: string;
  endDate: string;
  techStack: TechStack[];
  links: ProjectLink[];
  images: ProjectImage[];
  features: string[];
}

const defaultFormData: FormData = {
  slug: "",
  name: "",
  description: "",
  longDescription: "",
  category: "web",
  status: "planned",
  featured: false,
  order: 0,
  startDate: "",
  endDate: "",
  techStack: [],
  links: [],
  images: [],
  features: [],
};

interface ProjectFormProps {
  project?: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateProjectInput | UpdateProjectInput) => Promise<void>;
}

export function ProjectForm({
  project,
  open,
  onOpenChange,
  onSubmit,
}: ProjectFormProps) {
  const isEditing = !!project;

  // 폼 데이터 상태
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 프로젝트가 변경되면 폼 데이터 초기화
  useEffect(() => {
    if (open) {
      if (project) {
        setFormData({
          slug: project.slug,
          name: project.name,
          description: project.description,
          longDescription: project.longDescription ?? "",
          category: project.category,
          status: project.status,
          featured: project.featured ?? false,
          order: project.order ?? 0,
          startDate: project.startDate ?? "",
          endDate: project.endDate ?? "",
          techStack: project.techStack,
          links: project.links,
          images: project.images,
          features: project.features ?? [],
        });
      } else {
        setFormData(defaultFormData);
      }
      setErrors({});
    }
  }, [open, project]);

  // 폼 유효성 검사
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "프로젝트 이름을 입력해주세요";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "슬러그를 입력해주세요";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "소문자, 숫자, 하이픈만 사용 가능합니다";
    }

    if (!formData.description.trim()) {
      newErrors.description = "설명을 입력해주세요";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // 폼 제출
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) return;

      setIsSubmitting(true);
      try {
        const submitData: CreateProjectInput | UpdateProjectInput = {
          slug: formData.slug.trim(),
          name: formData.name.trim(),
          description: formData.description.trim(),
          longDescription: formData.longDescription.trim() || undefined,
          category: formData.category,
          status: formData.status,
          featured: formData.featured,
          order: formData.order,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          techStack: formData.techStack,
          links: formData.links,
          images: formData.images,
          features:
            formData.features.length > 0 ? formData.features : undefined,
        };

        await onSubmit(submitData);
        onOpenChange(false);
      } catch {
        // 에러는 상위에서 처리
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, onSubmit, onOpenChange, validateForm]
  );

  // 기술 스택 추가
  const addTechStack = () => {
    setFormData((prev) => ({
      ...prev,
      techStack: [...prev.techStack, { name: "", icon: "", url: "" }],
    }));
  };

  // 기술 스택 삭제
  const removeTechStack = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      techStack: prev.techStack.filter((_, i) => i !== index),
    }));
  };

  // 기술 스택 업데이트
  const updateTechStack = (
    index: number,
    field: keyof TechStack,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      techStack: prev.techStack.map((tech, i) =>
        i === index ? { ...tech, [field]: value } : tech
      ),
    }));
  };

  // 링크 추가
  const addLink = () => {
    setFormData((prev) => ({
      ...prev,
      links: [...prev.links, { type: "github", url: "", label: "" }],
    }));
  };

  // 링크 삭제
  const removeLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  };

  // 링크 업데이트
  const updateLink = (
    index: number,
    field: keyof ProjectLink,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  // 이미지 추가
  const addImage = () => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, { src: "", alt: "", isPrimary: false }],
    }));
  };

  // 이미지 삭제
  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // 이미지 업데이트
  const updateImage = (
    index: number,
    field: keyof ProjectImage,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) =>
        i === index ? { ...img, [field]: value } : img
      ),
    }));
  };

  // 기능 추가
  const addFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, ""],
    }));
  };

  // 기능 삭제
  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // 기능 업데이트
  const updateFeature = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.map((f, i) => (i === index ? value : f)),
    }));
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[90vh] w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-lg border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {/* 헤더 */}
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="flex items-center gap-2 text-lg font-semibold">
              <FolderKanban className="h-5 w-5 text-primary" />
              {isEditing ? "프로젝트 수정" : "새 프로젝트"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-full p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 섹션 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                기본 정보
              </h3>

              {/* 이름 & 슬러그 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="name">
                    프로젝트 이름 *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="예: My Project"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="slug">
                    슬러그 *
                  </label>
                  <input
                    id="slug"
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        slug: e.target.value.toLowerCase(),
                      }))
                    }
                    placeholder="예: my-project"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.slug && (
                    <p className="text-xs text-destructive">{errors.slug}</p>
                  )}
                </div>
              </div>

              {/* 설명 */}
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="description">
                  짧은 설명 *
                </label>
                <input
                  id="description"
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="프로젝트에 대한 짧은 설명"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.description && (
                  <p className="text-xs text-destructive">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* 상세 설명 */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="longDescription"
                >
                  상세 설명
                </label>
                <textarea
                  id="longDescription"
                  rows={3}
                  value={formData.longDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      longDescription: e.target.value,
                    }))
                  }
                  placeholder="프로젝트에 대한 자세한 설명"
                  className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* 카테고리 & 상태 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="category">
                    카테고리
                  </label>
                  <div className="relative">
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value as ProjectCategory,
                        }))
                      }
                      className="w-full appearance-none rounded-md border bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="status">
                    상태
                  </label>
                  <div className="relative">
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.value as ProjectStatus,
                        }))
                      }
                      className="w-full appearance-none rounded-md border bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {statuses.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Featured & Order */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    id="featured"
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        featured: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label className="text-sm font-medium" htmlFor="featured">
                    Featured 프로젝트
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="order">
                    정렬 순서
                  </label>
                  <input
                    id="order"
                    type="number"
                    min={0}
                    value={formData.order}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        order: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* 시작일 & 종료일 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="startDate">
                    시작일
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="endDate">
                    종료일
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* 기술 스택 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  기술 스택
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTechStack}
                >
                  <Plus className="h-4 w-4" />
                  추가
                </Button>
              </div>

              {formData.techStack.map((tech, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="grid flex-1 grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={tech.name}
                      onChange={(e) =>
                        updateTechStack(index, "name", e.target.value)
                      }
                      placeholder="이름"
                      className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      value={tech.icon ?? ""}
                      onChange={(e) =>
                        updateTechStack(index, "icon", e.target.value)
                      }
                      placeholder="아이콘"
                      className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      value={tech.url ?? ""}
                      onChange={(e) =>
                        updateTechStack(index, "url", e.target.value)
                      }
                      placeholder="URL"
                      className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTechStack(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {/* 링크 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  링크
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLink}
                >
                  <Plus className="h-4 w-4" />
                  추가
                </Button>
              </div>

              {formData.links.map((link, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="grid flex-1 grid-cols-3 gap-2">
                    <div className="relative">
                      <select
                        value={link.type}
                        onChange={(e) =>
                          updateLink(index, "type", e.target.value)
                        }
                        className="w-full appearance-none rounded-md border bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {linkTypes.map((lt) => (
                          <option key={lt.value} value={lt.value}>
                            {lt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => updateLink(index, "url", e.target.value)}
                      placeholder="URL"
                      className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      value={link.label ?? ""}
                      onChange={(e) =>
                        updateLink(index, "label", e.target.value)
                      }
                      placeholder="라벨"
                      className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLink(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {/* 이미지 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  이미지
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addImage}
                >
                  <Plus className="h-4 w-4" />
                  추가
                </Button>
              </div>

              {formData.images.map((image, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="grid flex-1 grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={image.src}
                      onChange={(e) => updateImage(index, "src", e.target.value)}
                      placeholder="이미지 경로"
                      className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      value={image.alt}
                      onChange={(e) => updateImage(index, "alt", e.target.value)}
                      placeholder="대체 텍스트"
                      className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        id={`primary-${index}`}
                        type="checkbox"
                        checked={image.isPrimary ?? false}
                        onChange={(e) =>
                          updateImage(index, "isPrimary", e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label
                        className="text-sm"
                        htmlFor={`primary-${index}`}
                      >
                        대표 이미지
                      </label>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeImage(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {/* 기능 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  주요 기능
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFeature}
                >
                  <Plus className="h-4 w-4" />
                  추가
                </Button>
              </div>

              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="기능 설명"
                    className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFeature(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  취소
                </Button>
              </Dialog.Close>
              <Button type="submit" loading={isSubmitting}>
                {isEditing ? "수정" : "생성"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

"use client";

import { memo, useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  getShimmerDataUrl,
  getCategoryPlaceholder,
  getResponsiveSizes,
  isValidImageUrl,
} from "@/lib/imageUtils";
import type { ProjectCategory } from "@/types/project";

/**
 * ProjectImage 컴포넌트 Props
 */
export interface ProjectImageProps {
  /** 이미지 소스 URL */
  src: string;
  /** 이미지 대체 텍스트 */
  alt: string;
  /** 이미지 너비 (픽셀) */
  width?: number;
  /** 이미지 높이 (픽셀) */
  height?: number;
  /** 우선 로드 여부 (LCP 이미지용) */
  priority?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 이미지 로드 실패 시 사용할 카테고리 (플레이스홀더용) */
  fallbackCategory?: ProjectCategory;
  /** fill 모드 사용 여부 */
  fill?: boolean;
  /** object-fit 스타일 */
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  /** 이미지 컨테이너 종횡비 */
  aspectRatio?: string;
  /** 로딩 중 shimmer 효과 표시 여부 */
  showShimmer?: boolean;
  /** 이미지 로드 완료 콜백 */
  onLoad?: () => void;
  /** 이미지 로드 에러 콜백 */
  onError?: () => void;
}

/**
 * 최적화된 프로젝트 이미지 컴포넌트
 *
 * - Next.js Image 컴포넌트 래퍼
 * - 로딩 중 shimmer 효과 (blurDataURL)
 * - 이미지 로드 실패 시 카테고리별 플레이스홀더 표시
 * - 반응형 sizes 속성 자동 설정
 * - lazy loading 기본 적용
 *
 * @example
 * ```tsx
 * <ProjectImage
 *   src="/images/projects/my-project.png"
 *   alt="My Project Screenshot"
 *   width={800}
 *   height={600}
 *   fallbackCategory="web"
 * />
 * ```
 */
function ProjectImageComponent({
  src,
  alt,
  width = 400,
  height = 300,
  priority = false,
  className,
  fallbackCategory = "other",
  fill = false,
  objectFit = "cover",
  aspectRatio,
  showShimmer = true,
  onLoad,
  onError,
}: ProjectImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 이미지 로드 완료 핸들러
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  // 이미지 로드 에러 핸들러
  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  // 유효하지 않은 URL이면 에러 상태로 처리
  const isValid = isValidImageUrl(src);
  const effectiveHasError = hasError || !isValid;

  // shimmer 효과를 위한 blur data URL
  const blurDataURL = showShimmer ? getShimmerDataUrl(width, height) : undefined;

  // 에러 시 카테고리별 플레이스홀더 표시
  if (effectiveHasError) {
    const placeholder = getCategoryPlaceholder(fallbackCategory, width, height);
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          fill && "absolute inset-0", // fill 모드일 때 부모 크기 채우기
          aspectRatio && `aspect-[${aspectRatio}]`,
          className
        )}
        style={!fill && !aspectRatio ? { width, height } : undefined}
      >
        <Image
          src={placeholder}
          alt={`${alt} - Placeholder`}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          className={cn("object-cover", fill && `object-${objectFit}`)}
          unoptimized
        />
      </div>
    );
  }

  // 반응형 sizes 계산
  const sizes = getResponsiveSizes(width);

  // 컨테이너 스타일
  const containerStyle = !fill && !aspectRatio ? { width, height } : undefined;
  const containerClasses = cn(
    "relative overflow-hidden",
    fill && "absolute inset-0", // fill 모드일 때 부모 크기 채우기
    aspectRatio && `aspect-[${aspectRatio}]`,
    isLoading && showShimmer && "animate-pulse bg-muted",
    className
  );

  return (
    <div className={containerClasses} style={containerStyle}>
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        sizes={sizes}
        placeholder={blurDataURL ? "blur" : "empty"}
        blurDataURL={blurDataURL}
        className={cn(
          "transition-opacity duration-300",
          fill ? `object-${objectFit}` : "object-cover",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

/**
 * 메모이제이션된 ProjectImage 컴포넌트
 */
export const ProjectImage = memo(ProjectImageComponent);
ProjectImage.displayName = "ProjectImage";

/**
 * ProjectImageGallery 컴포넌트 Props
 */
export interface ProjectImageGalleryProps {
  /** 이미지 배열 */
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
    isPrimary?: boolean;
  }>;
  /** 프로젝트 카테고리 (플레이스홀더용) */
  category: ProjectCategory;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 그리드 열 수 */
  columns?: 1 | 2 | 3 | 4;
  /** 갤러리 아이템 종횡비 */
  aspectRatio?: string;
}

/**
 * 프로젝트 이미지 갤러리 컴포넌트
 *
 * 여러 이미지를 그리드 형태로 표시합니다.
 * 첫 번째 이미지 또는 isPrimary가 true인 이미지가 메인으로 표시됩니다.
 *
 * @example
 * ```tsx
 * <ProjectImageGallery
 *   images={project.images}
 *   category={project.category}
 *   columns={2}
 * />
 * ```
 */
function ProjectImageGalleryComponent({
  images,
  category,
  className,
  columns = 2,
  aspectRatio = "16/9",
}: ProjectImageGalleryProps) {
  // 이미지가 없으면 플레이스홀더 1개 표시
  if (!images || images.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <ProjectImage
          src=""
          alt="No image available"
          width={800}
          height={450}
          fallbackCategory={category}
          aspectRatio={aspectRatio}
          className="w-full rounded-lg"
        />
      </div>
    );
  }

  // 단일 이미지
  if (images.length === 1) {
    const img = images[0];
    return (
      <div className={cn("w-full", className)}>
        <ProjectImage
          src={img.src}
          alt={img.alt}
          width={img.width || 800}
          height={img.height || 450}
          fallbackCategory={category}
          aspectRatio={aspectRatio}
          className="w-full rounded-lg"
          priority
        />
      </div>
    );
  }

  // 메인 이미지 찾기 (isPrimary 또는 첫 번째)
  const primaryIndex = images.findIndex((img) => img.isPrimary);
  const mainImage = primaryIndex >= 0 ? images[primaryIndex] : images[0];
  const otherImages = images.filter((_, i) =>
    primaryIndex >= 0 ? i !== primaryIndex : i !== 0
  );

  // 그리드 클래스 설정
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* 메인 이미지 */}
      <ProjectImage
        src={mainImage.src}
        alt={mainImage.alt}
        width={mainImage.width || 800}
        height={mainImage.height || 450}
        fallbackCategory={category}
        aspectRatio={aspectRatio}
        className="w-full rounded-lg"
        priority
      />

      {/* 추가 이미지 그리드 */}
      {otherImages.length > 0 && (
        <div className={cn("grid gap-2", gridCols[columns])}>
          {otherImages.map((img, index) => (
            <ProjectImage
              key={`${img.src}-${index}`}
              src={img.src}
              alt={img.alt}
              width={img.width || 400}
              height={img.height || 225}
              fallbackCategory={category}
              aspectRatio={aspectRatio}
              className="w-full rounded-md"
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 메모이제이션된 ProjectImageGallery 컴포넌트
 */
export const ProjectImageGallery = memo(ProjectImageGalleryComponent);
ProjectImageGallery.displayName = "ProjectImageGallery";

export default ProjectImage;

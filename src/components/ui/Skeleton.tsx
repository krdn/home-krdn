import { cn } from "@/lib/utils";

/**
 * Skeleton 컴포넌트
 * 로딩 상태를 표시하기 위한 플레이스홀더 컴포넌트
 */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 원형 스켈레톤 (아바타용) */
  circle?: boolean;
}

/**
 * 기본 Skeleton 컴포넌트
 * pulse 애니메이션으로 로딩 상태를 표시
 */
export function Skeleton({ className, circle, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        circle ? "rounded-full" : "rounded-md",
        className
      )}
      {...props}
    />
  );
}

/**
 * 텍스트 라인 스켈레톤
 * 여러 줄의 텍스트를 표시하는 로딩 상태
 */
export function SkeletonText({
  className,
  lines = 2,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-1/2" : "w-3/4")}
        />
      ))}
    </div>
  );
}

/**
 * 카드 스켈레톤
 * 카드 형태의 콘텐츠 로딩 상태
 */
export function SkeletonCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border bg-card p-4 space-y-3", className)}
      {...props}
    >
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

/**
 * 아바타 스켈레톤
 * 프로필 이미지 등 원형 요소의 로딩 상태
 */
export function SkeletonAvatar({
  className,
  size = "md",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <Skeleton
      circle
      className={cn(sizeClasses[size], className)}
      {...props}
    />
  );
}

/**
 * 리스트 아이템 스켈레톤
 * 리스트 형태의 콘텐츠 로딩 상태
 */
export function SkeletonListItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-3 p-3", className)}
      {...props}
    >
      <SkeletonAvatar size="sm" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

/**
 * 테이블 행 스켈레톤
 * 테이블 데이터 로딩 상태
 */
export function SkeletonTableRow({
  className,
  columns = 4,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { columns?: number }) {
  return (
    <div
      className={cn("flex items-center gap-4 p-3 border-b", className)}
      {...props}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === 0 ? "w-1/4" : i === columns - 1 ? "w-16" : "flex-1"
          )}
        />
      ))}
    </div>
  );
}

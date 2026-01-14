import type { ProjectCategory } from "@/types/project";

/**
 * 이미지 유틸리티 함수
 * 프로젝트 이미지 최적화 및 플레이스홀더 생성을 위한 유틸리티
 */

// 카테고리별 기본 색상 (shimmer/placeholder용)
const CATEGORY_PLACEHOLDER_COLORS: Record<ProjectCategory, { bg: string; fg: string }> = {
  web: { bg: "#0ea5e9", fg: "#e0f2fe" },         // blue
  automation: { bg: "#f97316", fg: "#fff7ed" },  // orange
  ai: { bg: "#a855f7", fg: "#faf5ff" },          // purple
  infra: { bg: "#22c55e", fg: "#f0fdf4" },       // green
  other: { bg: "#6b7280", fg: "#f3f4f6" },       // gray
};

/**
 * shimmer 효과 SVG를 base64로 인코딩
 * Next.js Image 컴포넌트의 blurDataURL로 사용
 */
export function getShimmerDataUrl(width: number, height: number): string {
  const shimmerSvg = `
    <svg width="${width}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#f3f4f6" offset="20%" />
          <stop stop-color="#e5e7eb" offset="50%" />
          <stop stop-color="#f3f4f6" offset="70%" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="#f3f4f6" />
      <rect id="r" width="${width}" height="${height}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${width}" to="${width}" dur="1s" repeatCount="indefinite" />
    </svg>`;

  const base64 = Buffer.from(shimmerSvg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * 카테고리별 색상이 적용된 shimmer 효과 생성
 */
export function getCategoryShimmerDataUrl(
  category: ProjectCategory,
  width: number,
  height: number
): string {
  const colors = CATEGORY_PLACEHOLDER_COLORS[category];
  const shimmerSvg = `
    <svg width="${width}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="${colors.bg}" offset="20%" />
          <stop stop-color="${colors.fg}" offset="50%" />
          <stop stop-color="${colors.bg}" offset="70%" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="${colors.bg}" />
      <rect id="r" width="${width}" height="${height}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${width}" to="${width}" dur="1s" repeatCount="indefinite" />
    </svg>`;

  const base64 = Buffer.from(shimmerSvg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * 플레이스홀더 이미지 URL 생성 (텍스트 포함)
 * 외부 서비스 대신 내장 SVG 사용
 */
export function getPlaceholderImage(
  width: number,
  height: number,
  text?: string
): string {
  const displayText = text || `${width}x${height}`;
  const fontSize = Math.min(width, height) / 8;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <text
        x="50%"
        y="50%"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${fontSize}"
        fill="#9ca3af"
        text-anchor="middle"
        dominant-baseline="middle"
      >${displayText}</text>
    </svg>`;

  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * 카테고리별 기본 프로젝트 이미지 경로
 */
export function getDefaultProjectImage(category: ProjectCategory): string {
  // 실제 이미지 파일이 있으면 해당 경로 반환
  // 없으면 플레이스홀더 SVG 생성
  const defaultImages: Record<ProjectCategory, string> = {
    web: "/images/projects/default-web.svg",
    automation: "/images/projects/default-automation.svg",
    ai: "/images/projects/default-ai.svg",
    infra: "/images/projects/default-infra.svg",
    other: "/images/projects/default-other.svg",
  };
  return defaultImages[category];
}

/**
 * 카테고리별 플레이스홀더 SVG 데이터 URL 생성
 * 아이콘과 텍스트가 포함된 플레이스홀더
 */
export function getCategoryPlaceholder(
  category: ProjectCategory,
  width: number = 400,
  height: number = 300
): string {
  const colors = CATEGORY_PLACEHOLDER_COLORS[category];
  const iconSize = Math.min(width, height) / 4;
  const fontSize = Math.min(width, height) / 12;

  // 카테고리별 심플 아이콘 (SVG path)
  const icons: Record<ProjectCategory, string> = {
    web: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
    automation: "M22 5.72l-4.6 3.86-1.29-1.29 4.6-3.86L22 5.72zM7.88 5.72L5.79 3.63 1.2 7.49l2.09 2.09 4.59-3.86zM12 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7zm1-11h-2v3H8v2h3v3h2v-3h3v-2h-3V9z",
    ai: "M12 2a9 9 0 0 0-9 9c0 4.17 2.84 7.67 6.69 8.69L12 22l2.31-2.31C18.16 18.67 21 15.17 21 11a9 9 0 0 0-9-9zm0 2c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.3c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z",
    infra: "M4 1h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2zm0 8h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2zm0 8h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2zM9 5H7v2h2V5zm0 8H7v2h2v-2zm0 8H7v2h2v-2z",
    other: "M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z",
  };

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.bg};stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:${colors.bg};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bgGrad)"/>
      <g transform="translate(${(width - iconSize) / 2}, ${(height - iconSize) / 2 - fontSize}) scale(${iconSize / 24})">
        <path d="${icons[category]}" fill="${colors.fg}" opacity="0.8"/>
      </g>
      <text
        x="50%"
        y="${height / 2 + iconSize / 2}"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${fontSize}"
        font-weight="500"
        fill="${colors.fg}"
        text-anchor="middle"
        dominant-baseline="middle"
        opacity="0.9"
      >Project Image</text>
    </svg>`;

  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * 이미지 종횡비 계산
 */
export function getAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}/${height / divisor}`;
}

/**
 * 반응형 sizes 속성 생성
 * 최대 너비 기준으로 반응형 사이즈 문자열 생성
 */
export function getResponsiveSizes(maxWidth: number): string {
  if (maxWidth <= 640) {
    return "100vw";
  }
  if (maxWidth <= 768) {
    return "(max-width: 640px) 100vw, 50vw";
  }
  if (maxWidth <= 1024) {
    return "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw";
  }
  return `(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, ${maxWidth}px`;
}

/**
 * Next.js Image 로더 (커스텀 이미지 서버용)
 * 기본 Next.js 이미지 최적화를 사용하므로 일반적으로 필요 없음
 */
export function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // 외부 URL인 경우 그대로 반환
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  // 내부 이미지는 Next.js 기본 최적화 사용
  // 커스텀 이미지 서버가 있으면 여기서 URL 변환
  return `${src}?w=${width}&q=${quality || 75}`;
}

/**
 * 이미지 URL이 유효한지 확인 (간단한 형식 체크)
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  // data URL
  if (url.startsWith("data:image/")) return true;
  // 로컬 경로
  if (url.startsWith("/")) return true;
  // 외부 URL
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * 프로젝트 슬러그로 이미지 경로 생성
 */
export function getProjectImagePath(
  slug: string,
  type: "main" | "screenshot" = "main",
  index?: number
): string {
  if (type === "main") {
    return `/images/projects/${slug}/main.png`;
  }
  return `/images/projects/${slug}/screenshot-${index || 1}.png`;
}

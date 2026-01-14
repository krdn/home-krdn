/**
 * Design System Tokens
 * CSS 변수와 동기화된 디자인 토큰
 * globals.css의 CSS 변수를 TypeScript에서 참조할 수 있도록 제공합니다.
 */

/**
 * 타이포그래피 토큰
 * 일관된 폰트 패밀리와 크기 스케일
 */
export const typography = {
  fontFamily: {
    heading: "var(--font-heading)",
    body: "var(--font-body)",
  },
  fontSize: {
    xs: "var(--text-xs)",
    sm: "var(--text-sm)",
    base: "var(--text-base)",
    lg: "var(--text-lg)",
    xl: "var(--text-xl)",
    "2xl": "var(--text-2xl)",
    "3xl": "var(--text-3xl)",
  },
} as const;

/**
 * 애니메이션 토큰
 * 일관된 애니메이션 지속 시간과 이징 함수
 */
export const animation = {
  duration: {
    fast: "var(--duration-fast)",
    normal: "var(--duration-normal)",
    slow: "var(--duration-slow)",
  },
  easing: {
    out: "var(--ease-out)",
    inOut: "var(--ease-in-out)",
  },
} as const;

/**
 * 스페이싱 토큰
 * Tailwind CSS와 호환되는 스페이싱 스케일
 */
export const spacing = {
  1: "var(--space-1)",
  2: "var(--space-2)",
  3: "var(--space-3)",
  4: "var(--space-4)",
  6: "var(--space-6)",
  8: "var(--space-8)",
} as const;

/**
 * 컬러 토큰 (CSS 변수 참조)
 * 시맨틱 컬러 이름으로 접근 가능
 */
export const colors = {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: "hsl(var(--primary))",
  primaryForeground: "hsl(var(--primary-foreground))",
  secondary: "hsl(var(--secondary))",
  secondaryForeground: "hsl(var(--secondary-foreground))",
  muted: "hsl(var(--muted))",
  mutedForeground: "hsl(var(--muted-foreground))",
  accent: "hsl(var(--accent))",
  accentForeground: "hsl(var(--accent-foreground))",
  destructive: "hsl(var(--destructive))",
  destructiveForeground: "hsl(var(--destructive-foreground))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  info: "hsl(var(--info))",
  infoForeground: "hsl(var(--info-foreground))",
  surface: "hsl(var(--surface))",
  surfaceForeground: "hsl(var(--surface-foreground))",
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
} as const;

/**
 * 반지름 토큰
 * 일관된 border-radius 값
 */
export const radius = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
} as const;

/**
 * 디자인 시스템 전체 토큰
 */
export const designTokens = {
  typography,
  animation,
  spacing,
  colors,
  radius,
} as const;

export type Typography = typeof typography;
export type Animation = typeof animation;
export type Spacing = typeof spacing;
export type Colors = typeof colors;
export type Radius = typeof radius;
export type DesignTokens = typeof designTokens;

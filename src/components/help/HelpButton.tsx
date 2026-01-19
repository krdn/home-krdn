'use client';

/**
 * HelpButton 컴포넌트
 *
 * 도움말 버튼을 렌더링하고 클릭 시 해당 도움말을 모달로 표시합니다.
 * ? 아이콘을 클릭하면 useHelp의 openHelp가 호출됩니다.
 *
 * Phase 44: Help Infrastructure
 *
 * @example
 * ```tsx
 * // 페이지 도움말 버튼
 * <HelpButton helpId="page-dashboard" />
 *
 * // 위젯 도움말 버튼 (작은 크기)
 * <HelpButton helpId="widget-system-monitor" size="sm" />
 * ```
 */

import { HelpCircle } from 'lucide-react';
import { useHelp } from '@/hooks/useHelp';
import { cn } from '@/lib/utils';
import type { HelpId } from '@/types/help';

export interface HelpButtonProps {
  /** 연결할 도움말 ID */
  helpId: HelpId;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 아이콘 크기 */
  size?: 'sm' | 'md';
}

/**
 * 도움말 버튼 컴포넌트
 *
 * 클릭하면 해당 helpId의 도움말 모달이 열립니다.
 *
 * @param props - HelpButtonProps
 * @returns 도움말 버튼 JSX
 */
export function HelpButton({
  helpId,
  className,
  size = 'sm',
}: HelpButtonProps) {
  const { openHelp } = useHelp();

  // 아이콘 크기 매핑
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const buttonSize = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openHelp(helpId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        // 기본 스타일 (ghost 버튼)
        'inline-flex items-center justify-center rounded-md',
        buttonSize,
        // 색상 및 호버 효과
        'text-muted-foreground hover:text-foreground',
        'hover:bg-accent',
        // 트랜지션
        'transition-colors duration-200',
        // 포커스 링
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        // 추가 클래스
        className
      )}
      aria-label="도움말 열기"
      title="도움말"
    >
      <HelpCircle className={iconSize} />
    </button>
  );
}

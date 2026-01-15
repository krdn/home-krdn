/**
 * 스킵 링크 컴포넌트
 *
 * Phase 28: Accessibility Enhancement
 *
 * 키보드 사용자가 반복되는 네비게이션을 건너뛰고
 * 메인 콘텐츠로 바로 이동할 수 있게 합니다.
 */

'use client';

import { cn } from '@/lib/utils';

interface SkipLinkProps {
  /** 이동할 대상 ID (기본: main-content) */
  targetId?: string;
  /** 링크 텍스트 */
  children?: React.ReactNode;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 키보드 사용자용 스킵 링크
 *
 * 포커스 시에만 표시되며, 활성화하면 메인 콘텐츠로 이동합니다.
 *
 * @example
 * ```tsx
 * // layout.tsx
 * <body>
 *   <SkipLink />
 *   <Header />
 *   <main id="main-content" tabIndex={-1}>
 *     {children}
 *   </main>
 * </body>
 * ```
 */
export function SkipLink({
  targetId = 'main-content',
  children = '메인 콘텐츠로 건너뛰기',
  className,
}: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={cn(
        // 기본: 화면 밖에 숨김
        'sr-only',
        // 포커스 시: 화면에 표시
        'focus:not-sr-only',
        'focus:absolute focus:top-4 focus:left-4 focus:z-[100]',
        'focus:px-4 focus:py-2',
        'focus:bg-primary focus:text-primary-foreground',
        'focus:rounded-md focus:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'focus:font-medium',
        className
      )}
    >
      {children}
    </a>
  );
}

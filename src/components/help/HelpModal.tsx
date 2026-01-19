'use client';

/**
 * HelpModal 컴포넌트
 *
 * 도움말 콘텐츠를 모달로 표시합니다.
 * ESC 키, 백드롭 클릭으로 닫을 수 있으며, 포커스 트랩이 적용됩니다.
 *
 * Phase 44: Help Infrastructure
 *
 * @example
 * ```tsx
 * const { isOpen, currentContent, closeHelp } = useHelp();
 *
 * {isOpen && currentContent && (
 *   <HelpModal
 *     isOpen={isOpen}
 *     content={currentContent}
 *     onClose={closeHelp}
 *   />
 * )}
 * ```
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { cn } from '@/lib/utils';
import type { HelpContent } from '@/types/help';

export interface HelpModalProps {
  /** 모달 열림 상태 */
  isOpen: boolean;
  /** 표시할 도움말 콘텐츠 */
  content: HelpContent;
  /** 모달 닫기 콜백 */
  onClose: () => void;
}

/**
 * 도움말 모달 컴포넌트
 *
 * 접근성을 고려하여 role="dialog", aria-modal, 포커스 트랩이 적용됩니다.
 * Framer Motion으로 부드러운 페이드 인/아웃 애니메이션을 제공합니다.
 *
 * @param props - HelpModalProps
 * @returns 도움말 모달 JSX
 */
export function HelpModal({ isOpen, content, onClose }: HelpModalProps) {
  // 포커스 트랩 훅
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);

  // ESC 키 핸들러
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 백드롭 클릭 핸들러
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 백드롭 자체를 클릭했을 때만 닫기 (모달 내부 클릭은 무시)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 백드롭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* 모달 */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              // 위치
              'fixed left-1/2 top-1/2 z-50',
              '-translate-x-1/2 -translate-y-1/2',
              // 크기
              'w-full max-w-lg max-h-[85vh]',
              // 스타일
              'bg-card rounded-lg shadow-lg border border-border',
              // 레이아웃
              'flex flex-col overflow-hidden'
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-modal-title"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2
                id="help-modal-title"
                className="text-lg font-semibold text-foreground"
              >
                {content.title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'inline-flex items-center justify-center rounded-md',
                  'h-8 w-8',
                  'text-muted-foreground hover:text-foreground',
                  'hover:bg-accent',
                  'transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                )}
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 본문 */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div
                className={cn(
                  // Prose 스타일 (마크다운 형식의 텍스트)
                  'prose prose-sm dark:prose-invert max-w-none',
                  // 리스트 스타일
                  'prose-ul:my-2 prose-li:my-0.5',
                  // 강조 스타일
                  'prose-strong:text-foreground',
                  // 코드 스타일
                  'prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
                  // 단락 스타일
                  'prose-p:leading-relaxed'
                )}
              >
                {/* 콘텐츠를 줄바꿈 기준으로 렌더링 */}
                {content.content.split('\n\n').map((paragraph, index) => (
                  <div key={index} className="mb-3 last:mb-0">
                    {paragraph.startsWith('**') && paragraph.endsWith('**') ? (
                      // 굵은 제목
                      <p className="font-semibold text-foreground">
                        {paragraph.slice(2, -2)}
                      </p>
                    ) : paragraph.startsWith('**') ? (
                      // 굵은 제목으로 시작하는 단락
                      <div>
                        {paragraph.split('\n').map((line, lineIndex) => {
                          if (line.startsWith('**') && line.includes(':**')) {
                            const [title, ...rest] = line.split(':**');
                            return (
                              <p key={lineIndex} className="mb-1">
                                <strong className="text-foreground">
                                  {title.slice(2)}:
                                </strong>
                                {rest.join(':**')}
                              </p>
                            );
                          }
                          if (line.startsWith('- ')) {
                            return (
                              <p key={lineIndex} className="ml-4 text-muted-foreground">
                                {'\u2022'} {line.slice(2)}
                              </p>
                            );
                          }
                          if (line.startsWith('`') && line.endsWith('`')) {
                            return (
                              <code
                                key={lineIndex}
                                className="bg-muted px-1 py-0.5 rounded text-sm"
                              >
                                {line.slice(1, -1)}
                              </code>
                            );
                          }
                          return (
                            <p key={lineIndex} className="text-muted-foreground">
                              {line}
                            </p>
                          );
                        })}
                      </div>
                    ) : paragraph.startsWith('- ') ? (
                      // 목록
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {paragraph.split('\n').map((item, itemIndex) => (
                          <li key={itemIndex} className="ml-2">
                            {item.replace(/^- /, '')}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      // 일반 단락
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {paragraph}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 푸터 (관련 링크가 있을 때만) */}
            {content.relatedLinks && content.relatedLinks.length > 0 && (
              <div className="px-6 py-4 border-t border-border bg-muted/30">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  관련 링크
                </p>
                <div className="flex flex-wrap gap-2">
                  {content.relatedLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.href}
                      className={cn(
                        'inline-flex items-center gap-1',
                        'text-sm text-primary hover:underline',
                        'transition-colors duration-200'
                      )}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={
                        link.href.startsWith('http')
                          ? 'noopener noreferrer'
                          : undefined
                      }
                    >
                      {link.label}
                      {link.href.startsWith('http') && (
                        <ExternalLink className="h-3 w-3" />
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

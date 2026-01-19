'use client';

/**
 * useHelp 훅
 *
 * 도움말 모달의 열림/닫힘 상태와 현재 도움말 콘텐츠를 관리합니다.
 * HelpButton 및 HelpModal 컴포넌트와 함께 사용됩니다.
 *
 * Phase 44: Help Infrastructure
 *
 * @example
 * ```tsx
 * const { isOpen, currentContent, openHelp, closeHelp } = useHelp();
 *
 * // 도움말 열기
 * <button onClick={() => openHelp('page-dashboard')}>?</button>
 *
 * // 도움말 모달
 * {isOpen && currentContent && (
 *   <HelpModal
 *     title={currentContent.title}
 *     content={currentContent.content}
 *     onClose={closeHelp}
 *   />
 * )}
 * ```
 */

import { useState, useCallback } from 'react';
import { getHelpContent } from '@/data/help';
import type { HelpContent, HelpId } from '@/types/help';

/**
 * useHelp 훅 반환 타입
 */
export interface UseHelpReturn {
  /** 도움말 모달 열림 상태 */
  isOpen: boolean;
  /** 현재 표시 중인 도움말 ID */
  currentHelpId: HelpId | null;
  /** 현재 도움말 콘텐츠 (닫혀있으면 null) */
  currentContent: HelpContent | null;
  /** 도움말 열기 함수 */
  openHelp: (helpId: HelpId) => void;
  /** 도움말 닫기 함수 */
  closeHelp: () => void;
}

/**
 * 도움말 상태 관리 훅
 *
 * 도움말 모달의 상태를 관리하고, 콘텐츠 조회 기능을 제공합니다.
 *
 * @returns {UseHelpReturn} 도움말 상태 및 제어 함수
 */
export function useHelp(): UseHelpReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [currentHelpId, setCurrentHelpId] = useState<HelpId | null>(null);

  /**
   * 도움말 모달 열기
   * @param helpId - 표시할 도움말 ID
   */
  const openHelp = useCallback((helpId: HelpId) => {
    setCurrentHelpId(helpId);
    setIsOpen(true);
  }, []);

  /**
   * 도움말 모달 닫기
   */
  const closeHelp = useCallback(() => {
    setIsOpen(false);
    // ID는 유지하여 닫는 애니메이션 중에도 콘텐츠 표시 가능
    // 실제 null로 만들려면 setTimeout 등을 사용
  }, []);

  // 현재 콘텐츠 조회 (열려있고 ID가 있을 때만)
  const currentContent: HelpContent | null =
    isOpen && currentHelpId ? getHelpContent(currentHelpId) : null;

  return {
    isOpen,
    currentHelpId,
    currentContent,
    openHelp,
    closeHelp,
  };
}

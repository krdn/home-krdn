'use client';

/**
 * GlobalHelpModal 컴포넌트
 *
 * 전역 Provider에서 사용되는 도움말 모달입니다.
 * HelpContext의 상태를 사용하여 모달을 렌더링합니다.
 *
 * Phase 44: Help Infrastructure
 */

import { useHelpContext } from '@/contexts/HelpContext';
import { HelpModal } from './HelpModal';

/**
 * 전역 도움말 모달
 *
 * providers.tsx에서 한 번만 렌더링되며, 모든 HelpButton과 연동됩니다.
 */
export function GlobalHelpModal() {
  const { isOpen, currentContent, closeHelp } = useHelpContext();

  if (!isOpen || !currentContent) {
    return null;
  }

  return (
    <HelpModal
      isOpen={isOpen}
      content={currentContent}
      onClose={closeHelp}
    />
  );
}

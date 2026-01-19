'use client';

/**
 * HelpContext
 *
 * 도움말 모달 상태를 전역으로 공유하는 Context입니다.
 * HelpButton과 HelpModal이 서로 다른 위치에 있어도 상태를 공유할 수 있습니다.
 *
 * Phase 44: Help Infrastructure
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { getHelpContent } from '@/data/help';
import type { HelpContent, HelpId } from '@/types/help';

interface HelpContextValue {
  isOpen: boolean;
  currentHelpId: HelpId | null;
  currentContent: HelpContent | null;
  openHelp: (helpId: HelpId) => void;
  closeHelp: () => void;
}

const HelpContext = createContext<HelpContextValue | null>(null);

export function HelpProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentHelpId, setCurrentHelpId] = useState<HelpId | null>(null);

  const openHelp = useCallback((helpId: HelpId) => {
    setCurrentHelpId(helpId);
    setIsOpen(true);
  }, []);

  const closeHelp = useCallback(() => {
    setIsOpen(false);
  }, []);

  const currentContent: HelpContent | null =
    isOpen && currentHelpId ? getHelpContent(currentHelpId) : null;

  return (
    <HelpContext.Provider
      value={{
        isOpen,
        currentHelpId,
        currentContent,
        openHelp,
        closeHelp,
      }}
    >
      {children}
    </HelpContext.Provider>
  );
}

export function useHelpContext(): HelpContextValue {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelpContext must be used within HelpProvider');
  }
  return context;
}

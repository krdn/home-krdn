'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/**
 * 오프라인 상태 인디케이터
 * 네트워크 연결이 끊기면 상단에 배너를 표시합니다.
 *
 * Phase 24: Offline Caching
 */
export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground py-2 px-4 text-center text-sm"
        >
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span>오프라인 상태입니다. 일부 기능이 제한될 수 있습니다.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

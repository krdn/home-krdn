'use client';

import { useState, useEffect } from 'react';

/**
 * 온라인/오프라인 상태 감지 훅
 * navigator.onLine 및 online/offline 이벤트를 사용합니다.
 *
 * Phase 24: Offline Caching
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // 초기 상태 설정
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

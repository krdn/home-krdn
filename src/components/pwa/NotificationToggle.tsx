'use client';

import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushNotification } from '@/hooks/usePushNotification';

/**
 * 푸시 알림 토글 버튼
 * 사용자가 푸시 알림을 구독/해제할 수 있는 UI 컴포넌트
 *
 * Phase 23: Web Push 기반 푸시 알림
 */
export function NotificationToggle() {
  const { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe } =
    usePushNotification();

  // 지원하지 않는 브라우저에서는 숨김
  if (!isSupported) return null;

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  // 권한이 거부된 경우 비활성화
  const isDisabled = isLoading || permission === 'denied';

  return (
    <button
      onClick={handleToggle}
      disabled={isDisabled}
      className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title={
        permission === 'denied'
          ? '알림이 브라우저에서 차단되었습니다. 브라우저 설정에서 알림을 허용해주세요.'
          : isSubscribed
            ? '알림 끄기'
            : '알림 켜기'
      }
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="w-4 h-4 text-primary" />
      ) : (
        <BellOff className="w-4 h-4 text-muted-foreground" />
      )}
      <span className="hidden sm:inline">
        {isLoading ? '확인 중...' : isSubscribed ? '알림 켜짐' : '알림 꺼짐'}
      </span>
    </button>
  );
}

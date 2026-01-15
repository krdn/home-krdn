'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * 푸시 알림 구독 관리 훅
 * Web Push API를 사용하여 푸시 알림 구독/해제를 관리합니다.
 *
 * Phase 23: Web Push 기반 푸시 알림
 */
export function usePushNotification() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    const checkSupport = async () => {
      // 브라우저 지원 확인
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);

      if (supported) {
        // 현재 권한 상태 확인
        setPermission(Notification.permission);

        // 기존 구독 확인
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (error) {
          console.error('[Push] 구독 확인 오류:', error);
        }
      }

      setIsLoading(false);
    };

    checkSupport();
  }, []);

  /**
   * 푸시 알림 구독
   */
  const subscribe = useCallback(async () => {
    if (!isSupported) return false;

    try {
      // 알림 권한 요청
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        console.log('[Push] 알림 권한 거부됨');
        return false;
      }

      // Service Worker 준비 대기
      const registration = await navigator.serviceWorker.ready;

      // VAPID 공개키
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('[Push] VAPID 공개키가 설정되지 않았습니다');
        return false;
      }

      // 푸시 구독 생성
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // 서버에 구독 저장
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (response.ok) {
        setIsSubscribed(true);
        console.log('[Push] 구독 완료');
        return true;
      } else {
        console.error('[Push] 서버 구독 저장 실패:', response.status);
        return false;
      }
    } catch (error) {
      console.error('[Push] 구독 오류:', error);
      return false;
    }
  }, [isSupported]);

  /**
   * 푸시 알림 구독 해제
   */
  const unsubscribe = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // 서버에서 구독 삭제
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        // 브라우저 구독 해제
        await subscription.unsubscribe();
        setIsSubscribed(false);
        console.log('[Push] 구독 해제 완료');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Push] 구독 해제 오류:', error);
      return false;
    }
  }, [isSupported]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
  };
}

/**
 * Base64 URL을 Uint8Array로 변환
 * VAPID 공개키를 applicationServerKey로 사용하기 위해 필요
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

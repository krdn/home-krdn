'use client';

import { useEffect, useRef } from 'react';
import { useSystemMetrics } from './useSystemMetrics';
import { useAlertStore } from '@/stores/alertStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useToast } from '@/components/providers/ToastProvider';
import { evaluateMetrics } from '@/lib/alertEngine';
import type { NewAlert } from '@/types/alert';
import type { SlackBlockKitMessage } from '@/types/notification';

/**
 * 브라우저 알림 권한 요청
 * @returns 권한 허용 여부
 */
async function requestNotificationPermission(): Promise<boolean> {
  // 브라우저가 Notification API를 지원하지 않으면 false
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  // 이미 허용된 경우
  if (Notification.permission === 'granted') {
    return true;
  }

  // 이미 거부된 경우
  if (Notification.permission === 'denied') {
    return false;
  }

  // 권한 요청
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * 브라우저 알림 표시
 * @param alert 알림 데이터
 */
function showBrowserNotification(alert: NewAlert): void {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    Notification.permission !== 'granted'
  ) {
    return;
  }

  new Notification(alert.ruleName, {
    body: alert.message,
    icon: '/favicon.ico',
    tag: alert.ruleId, // 같은 규칙의 알림은 대체
  });
}

/**
 * 이메일 알림 발송
 * @param alert 알림 데이터
 * @param recipientEmail 수신자 이메일
 */
async function sendAlertEmail(
  alert: NewAlert,
  recipientEmail: string
): Promise<void> {
  try {
    const response = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipientEmail,
        subject: `${alert.severity.toUpperCase()}: ${alert.ruleName}`,
        html: `
          <h2>${alert.ruleName}</h2>
          <p>${alert.message}</p>
          <p><strong>심각도:</strong> ${alert.severity}</p>
          <p><strong>현재 값:</strong> ${alert.value.toFixed(1)}%</p>
          <p><strong>임계값:</strong> ${alert.threshold}%</p>
          <p><small>발생 시각: ${new Date().toLocaleString('ko-KR')}</small></p>
        `,
        ruleId: alert.ruleId,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      console.warn('[Alert Email] Failed:', data.error);
    }
  } catch (error) {
    console.error('[Alert Email] Error:', error);
  }
}

/**
 * Slack Block Kit 메시지 생성
 * @param alert 알림 데이터
 * @returns Slack Block Kit 메시지
 */
function createSlackMessage(alert: NewAlert): SlackBlockKitMessage {
  const severityEmoji =
    alert.severity === 'critical' ? '🚨' :
    alert.severity === 'warning' ? '⚠️' : 'ℹ️';

  return {
    text: `[${alert.severity.toUpperCase()}] ${alert.ruleName}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${severityEmoji} ${alert.ruleName}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: alert.message },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*심각도:*\n${alert.severity}` },
          { type: 'mrkdwn', text: `*현재 값:*\n${alert.value.toFixed(1)}%` },
          { type: 'mrkdwn', text: `*임계값:*\n${alert.threshold}%` },
          { type: 'mrkdwn', text: `*시각:*\n${new Date().toLocaleString('ko-KR')}` },
        ],
      },
      { type: 'divider' },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: '🏠 Home-KRDN 모니터링 시스템' },
        ],
      },
    ],
  };
}

/**
 * Slack 알림 발송
 * @param alert 알림 데이터
 * @param webhookUrl Slack Webhook URL
 */
async function sendSlackAlert(
  alert: NewAlert,
  webhookUrl: string
): Promise<void> {
  try {
    const message = createSlackMessage(alert);
    const response = await fetch('/api/notifications/slack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookUrl,
        message,
        ruleId: alert.ruleId,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      console.warn('[Alert Slack] Failed:', data.error);
    }
  } catch (error) {
    console.error('[Alert Slack] Error:', error);
  }
}

/**
 * 알림 통합 훅
 *
 * 시스템 메트릭을 감지하고 알림 규칙에 따라 알림을 발생시킵니다.
 * - Toast 알림 표시
 * - Critical 알림 시 브라우저 알림 표시
 * - 이메일 알림 발송 (설정 활성화 시)
 *
 * @example
 * ```tsx
 * function DashboardStats() {
 *   useAlertNotifications(); // 알림 시스템 활성화
 *   return <div>...</div>;
 * }
 * ```
 */
export function useAlertNotifications(): void {
  const { data: metrics } = useSystemMetrics();
  const { rules, addAlert } = useAlertStore();
  const { emailConfig, slackConfig } = useNotificationStore();
  const { showToast } = useToast();
  const permissionRequested = useRef(false);

  // 브라우저 알림 권한 요청 (최초 1회)
  useEffect(() => {
    if (!permissionRequested.current) {
      permissionRequested.current = true;
      requestNotificationPermission();
    }
  }, []);

  // 메트릭 변화 감지 및 알림 발생
  useEffect(() => {
    if (!metrics) return;

    // 메트릭 평가
    const newAlerts = evaluateMetrics(metrics, rules);

    // 각 알림에 대해 처리
    for (const alertData of newAlerts) {
      // 스토어에 추가
      addAlert(alertData);

      // Toast 표시
      showToast({
        title: alertData.ruleName,
        description: alertData.message,
        severity: alertData.severity,
        duration: alertData.severity === 'critical' ? 10000 : 5000,
      });

      // 브라우저 알림 (critical만)
      if (alertData.severity === 'critical') {
        showBrowserNotification(alertData);
      }

      // 이메일 알림 발송 (설정 활성화 시)
      if (
        emailConfig.enabled &&
        emailConfig.recipientEmail &&
        (!emailConfig.sendOnCriticalOnly || alertData.severity === 'critical')
      ) {
        // 비동기로 처리 (UI 블로킹 방지)
        sendAlertEmail(alertData, emailConfig.recipientEmail);
      }

      // Slack 알림 발송 (설정 활성화 시)
      if (
        slackConfig.enabled &&
        slackConfig.webhookUrl &&
        (!slackConfig.sendOnCriticalOnly || alertData.severity === 'critical')
      ) {
        // 비동기로 처리 (UI 블로킹 방지)
        sendSlackAlert(alertData, slackConfig.webhookUrl);
      }
    }
  }, [metrics, rules, addAlert, showToast, emailConfig, slackConfig]);
}

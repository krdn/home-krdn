/**
 * 알림 채널 타입 정의
 * 이메일, Slack 등 다양한 알림 채널을 지원합니다.
 */

// 알림 채널 타입 (이메일, Slack 등 확장 가능)
export type NotificationChannel = 'email' | 'slack' | 'toast' | 'browser';

// 이메일 알림 설정
export interface EmailNotificationConfig {
  enabled: boolean;
  recipientEmail: string;
  sendOnCriticalOnly: boolean; // true면 critical만 발송
  cooldownMinutes: number; // 같은 규칙 이메일 쿨다운
}

// 이메일 발송 요청 타입
export interface SendEmailRequest {
  to: string;
  subject: string;
  html: string;
  ruleId?: string; // 쿨다운 추적용
}

// 이메일 발송 응답 타입
export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

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

// Slack 알림 설정
export interface SlackNotificationConfig {
  enabled: boolean;
  webhookUrl: string; // 사용자가 입력 (보안상 클라이언트에 저장)
  sendOnCriticalOnly: boolean;
  cooldownMinutes: number;
}

// Slack Block Kit 메시지 타입
export interface SlackBlockKitMessage {
  text: string; // Fallback for notifications
  blocks: SlackBlock[];
}

export type SlackBlock =
  | SlackHeaderBlock
  | SlackSectionBlock
  | SlackContextBlock
  | SlackDividerBlock;

export interface SlackHeaderBlock {
  type: 'header';
  text: { type: 'plain_text'; text: string; emoji?: boolean };
}

export interface SlackSectionBlock {
  type: 'section';
  text?: { type: 'mrkdwn'; text: string };
  fields?: Array<{ type: 'mrkdwn'; text: string }>;
}

export interface SlackContextBlock {
  type: 'context';
  elements: Array<{ type: 'mrkdwn'; text: string }>;
}

export interface SlackDividerBlock {
  type: 'divider';
}

// Slack 발송 응답 타입
export interface SendSlackResponse {
  success: boolean;
  error?: string;
}

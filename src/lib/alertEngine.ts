/**
 * 알림 엔진
 * 메트릭을 분석하여 알림 조건을 평가하고 알림을 생성합니다.
 * 팀 알림 채널 확장 (Phase 21)
 */

import type { SystemMetricsData } from '@/hooks/useSystemMetrics';
import type { AlertRule, AlertCategory, NewAlert, AlertOperator } from '@/types/alert';
import { ALERT_CONFIG } from '@/config/constants';
import { getTeamSettings, getTeamMemberEmails, getTeamById } from '@/lib/team-service';

// 마지막 알림 시간 추적 (쿨다운용)
const lastAlertTime: Map<string, number> = new Map();

/**
 * 메트릭에서 특정 카테고리/메트릭의 값을 추출
 */
function getMetricValue(
  metrics: SystemMetricsData,
  category: AlertCategory,
  metric: string
): number | null {
  switch (category) {
    case 'cpu':
      if (metric === 'usage') return metrics.cpu.usage;
      break;
    case 'memory':
      if (metric === 'usage') return metrics.memory.usage;
      break;
    case 'disk':
      if (metric === 'usage') return metrics.disk.usage;
      break;
    case 'network':
      // 네트워크는 모든 인터페이스의 합계 사용
      if (metric === 'rxBytes') {
        return metrics.network.reduce((sum, iface) => sum + iface.rxBytes, 0);
      }
      if (metric === 'txBytes') {
        return metrics.network.reduce((sum, iface) => sum + iface.txBytes, 0);
      }
      break;
    case 'container':
      // 컨테이너 메트릭은 별도 API 필요
      break;
  }
  return null;
}

/**
 * 조건 연산자 평가
 */
function evaluateCondition(
  value: number,
  operator: AlertOperator,
  threshold: number
): boolean {
  switch (operator) {
    case '>':
      return value > threshold;
    case '<':
      return value < threshold;
    case '>=':
      return value >= threshold;
    case '<=':
      return value <= threshold;
    case '==':
      return value === threshold;
    default:
      return false;
  }
}

/**
 * 쿨다운 상태 확인
 */
function isInCooldown(ruleId: string, cooldownSeconds: number): boolean {
  const lastTime = lastAlertTime.get(ruleId);
  if (!lastTime) return false;

  const cooldownMs = cooldownSeconds * 1000;
  return Date.now() - lastTime < cooldownMs;
}

/**
 * 알림 메시지 포맷
 */
function formatAlertMessage(rule: AlertRule, value: number): string {
  const categoryNames: Record<AlertCategory, string> = {
    cpu: 'CPU',
    memory: '메모리',
    disk: '디스크',
    network: '네트워크',
    container: '컨테이너',
  };

  const categoryName = categoryNames[rule.category];
  const operator = rule.condition.operator;
  const threshold = rule.condition.threshold;

  return `${categoryName} ${rule.condition.metric}: ${value.toFixed(1)}% (임계값: ${operator} ${threshold}%)`;
}

/**
 * 메트릭을 평가하고 알림 생성
 */
export function evaluateMetrics(
  metrics: SystemMetricsData,
  rules: AlertRule[]
): NewAlert[] {
  const newAlerts: NewAlert[] = [];

  for (const rule of rules) {
    // 비활성화된 규칙 스킵
    if (!rule.enabled) continue;

    // 메트릭 값 추출
    const value = getMetricValue(metrics, rule.category, rule.condition.metric);
    if (value === null) continue;

    // 조건 평가
    const triggered = evaluateCondition(
      value,
      rule.condition.operator,
      rule.condition.threshold
    );

    // 조건 충족 + 쿨다운 아닐 때만 알림 생성
    if (triggered && !isInCooldown(rule.id, rule.cooldown)) {
      newAlerts.push({
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        severity: rule.severity,
        status: 'active',
        message: formatAlertMessage(rule, value),
        value,
        threshold: rule.condition.threshold,
      });

      // 쿨다운 시작
      lastAlertTime.set(rule.id, Date.now());
    }
  }

  return newAlerts;
}

/**
 * 쿨다운 초기화 (테스트용)
 */
export function resetCooldowns(): void {
  lastAlertTime.clear();
}

/**
 * 특정 규칙의 쿨다운 초기화
 */
export function resetRuleCooldown(ruleId: string): void {
  lastAlertTime.delete(ruleId);
}

// ============================================================
// 팀 알림 채널 (Phase 21)
// ============================================================

/**
 * 팀 알림 타입
 */
export type TeamNotificationType = 'alert' | 'member_join' | 'member_leave';

/**
 * 팀 알림 메시지 인터페이스
 */
export interface TeamNotificationMessage {
  title: string;
  body: string;
  type: TeamNotificationType;
  metadata?: Record<string, unknown>;
}

/**
 * 팀에 알림을 발송합니다.
 * 팀 설정에 따라 이메일과 Slack 채널로 알림을 전송합니다.
 *
 * @param teamId 팀 ID
 * @param message 알림 메시지
 * @returns 발송 결과
 */
export async function sendTeamNotification(
  teamId: string,
  message: TeamNotificationMessage
): Promise<{ email: boolean; slack: boolean }> {
  const result = { email: false, slack: false };

  try {
    // 팀 설정 조회
    const settings = await getTeamSettings(teamId);

    // 알림 타입에 따른 설정 플래그 확인
    const shouldNotify = checkNotificationEnabled(settings, message.type);
    if (!shouldNotify) {
      return result;
    }

    // 팀 정보 조회 (알림 내용에 사용)
    const team = await getTeamById(teamId);
    const teamName = team?.name || '팀';

    // 병렬로 알림 발송
    const promises: Promise<void>[] = [];

    // 이메일 알림
    if (settings.emailNotifications) {
      promises.push(
        sendTeamEmailNotification(teamId, teamName, message)
          .then(() => {
            result.email = true;
          })
          .catch((error) => {
            console.error('[TeamNotification] 이메일 발송 실패:', error);
          })
      );
    }

    // Slack 알림
    if (settings.slackWebhookUrl) {
      promises.push(
        sendTeamSlackNotification(settings.slackWebhookUrl, teamName, message)
          .then(() => {
            result.slack = true;
          })
          .catch((error) => {
            console.error('[TeamNotification] Slack 발송 실패:', error);
          })
      );
    }

    await Promise.allSettled(promises);
  } catch (error) {
    console.error('[TeamNotification] 팀 알림 발송 오류:', error);
  }

  return result;
}

/**
 * 알림 타입에 따른 설정 플래그 확인
 */
function checkNotificationEnabled(
  settings: { notifyOnAlert: boolean; notifyOnMemberJoin: boolean; notifyOnMemberLeave: boolean },
  type: TeamNotificationType
): boolean {
  switch (type) {
    case 'alert':
      return settings.notifyOnAlert;
    case 'member_join':
      return settings.notifyOnMemberJoin;
    case 'member_leave':
      return settings.notifyOnMemberLeave;
    default:
      return false;
  }
}

/**
 * 팀 멤버들에게 이메일 알림을 발송합니다.
 */
async function sendTeamEmailNotification(
  teamId: string,
  teamName: string,
  message: TeamNotificationMessage
): Promise<void> {
  // 팀 멤버 이메일 목록 조회
  const emails = await getTeamMemberEmails(teamId);
  if (emails.length === 0) {
    return;
  }

  // 이메일 발송 API 호출
  const response = await fetch('/api/notifications/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: emails,
      subject: `[${teamName}] ${message.title}`,
      body: message.body,
      type: 'team_notification',
    }),
  });

  if (!response.ok) {
    throw new Error(`이메일 발송 실패: ${response.status}`);
  }
}

/**
 * Slack 웹훅으로 알림을 발송합니다.
 */
async function sendTeamSlackNotification(
  webhookUrl: string,
  teamName: string,
  message: TeamNotificationMessage
): Promise<void> {
  // Slack Block Kit 메시지 생성
  const blocks = buildSlackBlocks(teamName, message);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });

  if (!response.ok) {
    throw new Error(`Slack 발송 실패: ${response.status}`);
  }
}

/**
 * Slack Block Kit 메시지를 생성합니다.
 */
function buildSlackBlocks(teamName: string, message: TeamNotificationMessage) {
  const emoji = getNotificationEmoji(message.type);

  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} [${teamName}] ${message.title}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: message.body,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `📅 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
        },
      ],
    },
  ];
}

/**
 * 알림 타입에 따른 이모지 반환
 */
function getNotificationEmoji(type: TeamNotificationType): string {
  switch (type) {
    case 'alert':
      return '🚨';
    case 'member_join':
      return '👋';
    case 'member_leave':
      return '👤';
    default:
      return '📢';
  }
}

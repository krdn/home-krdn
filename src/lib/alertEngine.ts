/**
 * 알림 엔진
 * 메트릭을 분석하여 알림 조건을 평가하고 알림을 생성합니다.
 */

import type { SystemMetricsData } from '@/hooks/useSystemMetrics';
import type { AlertRule, AlertCategory, NewAlert, AlertOperator } from '@/types/alert';
import { ALERT_CONFIG } from '@/config/constants';

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

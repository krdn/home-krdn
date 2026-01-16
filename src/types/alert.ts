/**
 * 알림 시스템 타입 정의
 * 알림 규칙, 알림 인스턴스, 관련 타입을 정의합니다.
 */

// 알림 심각도
export type AlertSeverity = 'info' | 'warning' | 'critical';

// 알림 상태
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

// 알림 카테고리
export type AlertCategory = 'cpu' | 'memory' | 'disk' | 'container' | 'network' | 'log';

// 조건 연산자
export type AlertOperator = '>' | '<' | '>=' | '<=' | '==';

// 알림 조건
export interface AlertCondition {
  metric: string;
  operator: AlertOperator;
  threshold: number;
}

// 알림 규칙
export interface AlertRule {
  id: string;
  name: string;
  category: AlertCategory;
  condition: AlertCondition;
  severity: AlertSeverity;
  enabled: boolean;
  cooldown: number; // 재알림까지 대기 시간 (초)
}

// 알림 인스턴스
export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  category: AlertCategory;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  value: number;
  threshold: number;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

// 알림 생성용 타입 (id, createdAt 제외)
export type NewAlert = Omit<Alert, 'id' | 'createdAt'>;

// 규칙 생성용 타입 (id 제외)
export type NewAlertRule = Omit<AlertRule, 'id'>;

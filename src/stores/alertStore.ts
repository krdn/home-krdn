'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Alert,
  AlertRule,
  AlertSeverity,
  NewAlert,
  NewAlertRule,
} from '@/types/alert';

// 기본 알림 규칙
function getDefaultRules(): AlertRule[] {
  return [
    // CPU 규칙
    {
      id: 'default-cpu-critical',
      name: 'CPU 위험',
      category: 'cpu',
      condition: { metric: 'usage', operator: '>', threshold: 90 },
      severity: 'critical',
      enabled: true,
      cooldown: 300,
    },
    {
      id: 'default-cpu-warning',
      name: 'CPU 경고',
      category: 'cpu',
      condition: { metric: 'usage', operator: '>', threshold: 70 },
      severity: 'warning',
      enabled: true,
      cooldown: 300,
    },
    // Memory 규칙
    {
      id: 'default-memory-critical',
      name: '메모리 위험',
      category: 'memory',
      condition: { metric: 'usage', operator: '>', threshold: 90 },
      severity: 'critical',
      enabled: true,
      cooldown: 300,
    },
    {
      id: 'default-memory-warning',
      name: '메모리 경고',
      category: 'memory',
      condition: { metric: 'usage', operator: '>', threshold: 80 },
      severity: 'warning',
      enabled: true,
      cooldown: 300,
    },
    // Disk 규칙
    {
      id: 'default-disk-critical',
      name: '디스크 위험',
      category: 'disk',
      condition: { metric: 'usage', operator: '>', threshold: 95 },
      severity: 'critical',
      enabled: true,
      cooldown: 600,
    },
    {
      id: 'default-disk-warning',
      name: '디스크 경고',
      category: 'disk',
      condition: { metric: 'usage', operator: '>', threshold: 85 },
      severity: 'warning',
      enabled: true,
      cooldown: 600,
    },
  ];
}

// 최대 알림 저장 개수
const MAX_ALERTS = 100;

interface AlertState {
  // 상태
  alerts: Alert[];
  rules: AlertRule[];

  // 알림 액션
  addAlert: (alert: NewAlert) => void;
  acknowledgeAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  clearResolvedAlerts: () => void;

  // 규칙 액션
  addRule: (rule: NewAlertRule) => void;
  updateRule: (id: string, updates: Partial<AlertRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;

  // 셀렉터
  getActiveAlerts: () => Alert[];
  getAlertsBySeverity: (severity: AlertSeverity) => Alert[];
}

export const useAlertStore = create<AlertState>()(
  persist(
    (set, get) => ({
      alerts: [],
      rules: getDefaultRules(),

      // 알림 추가
      addAlert: (alertData: NewAlert) =>
        set((state) => {
          const newAlert: Alert = {
            ...alertData,
            id: crypto.randomUUID(),
            createdAt: new Date(),
          };

          // 최대 개수 제한
          const alerts = [newAlert, ...state.alerts].slice(0, MAX_ALERTS);
          return { alerts };
        }),

      // 알림 확인
      acknowledgeAlert: (id: string) =>
        set((state) => ({
          alerts: state.alerts.map((alert) =>
            alert.id === id
              ? { ...alert, status: 'acknowledged', acknowledgedAt: new Date() }
              : alert
          ),
        })),

      // 알림 해제
      resolveAlert: (id: string) =>
        set((state) => ({
          alerts: state.alerts.map((alert) =>
            alert.id === id
              ? { ...alert, status: 'resolved', resolvedAt: new Date() }
              : alert
          ),
        })),

      // 해제된 알림 삭제
      clearResolvedAlerts: () =>
        set((state) => ({
          alerts: state.alerts.filter((alert) => alert.status !== 'resolved'),
        })),

      // 규칙 추가
      addRule: (ruleData: NewAlertRule) =>
        set((state) => ({
          rules: [
            ...state.rules,
            { ...ruleData, id: crypto.randomUUID() },
          ],
        })),

      // 규칙 수정
      updateRule: (id: string, updates: Partial<AlertRule>) =>
        set((state) => ({
          rules: state.rules.map((rule) =>
            rule.id === id ? { ...rule, ...updates } : rule
          ),
        })),

      // 규칙 삭제
      deleteRule: (id: string) =>
        set((state) => ({
          rules: state.rules.filter((rule) => rule.id !== id),
        })),

      // 규칙 활성화 토글
      toggleRule: (id: string) =>
        set((state) => ({
          rules: state.rules.map((rule) =>
            rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
          ),
        })),

      // 활성 알림 조회
      getActiveAlerts: () =>
        get().alerts.filter((alert) => alert.status === 'active'),

      // 심각도별 알림 조회
      getAlertsBySeverity: (severity: AlertSeverity) =>
        get().alerts.filter((alert) => alert.severity === severity),
    }),
    {
      name: 'alert-store',
      // Date 객체 직렬화/역직렬화 처리
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          // Date 문자열을 Date 객체로 변환
          if (data.state?.alerts) {
            data.state.alerts = data.state.alerts.map((alert: Alert) => ({
              ...alert,
              createdAt: new Date(alert.createdAt),
              acknowledgedAt: alert.acknowledgedAt
                ? new Date(alert.acknowledgedAt)
                : undefined,
              resolvedAt: alert.resolvedAt
                ? new Date(alert.resolvedAt)
                : undefined,
            }));
          }
          return data;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);

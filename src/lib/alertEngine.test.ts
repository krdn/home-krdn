/**
 * alertEngine TDD 테스트
 * 알림 엔진의 핵심 비즈니스 로직을 검증합니다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { evaluateMetrics, resetCooldowns, resetRuleCooldown } from './alertEngine';
import type { SystemMetricsData } from '@/hooks/useSystemMetrics';
import type { AlertRule } from '@/types/alert';

// Mock SystemMetricsData 생성 헬퍼
function createMockMetrics(overrides: Partial<{
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}>): SystemMetricsData {
  return {
    cpu: { usage: overrides.cpuUsage ?? 50 },
    memory: {
      usage: overrides.memoryUsage ?? 50,
      total: 16000000000,
      used: 8000000000,
      available: 8000000000,
    },
    disk: {
      usage: overrides.diskUsage ?? 50,
      total: 500000000000,
      used: 250000000000,
      free: 250000000000,
    },
    network: [
      {
        interface: 'eth0',
        rxBytes: 1000000,
        txBytes: 500000,
        rxPackets: 1000,
        txPackets: 500,
      },
    ],
    uptime: 86400,
    timestamp: Date.now(),
  };
}

// Mock AlertRule 생성 헬퍼
function createMockRule(overrides: Partial<AlertRule> = {}): AlertRule {
  return {
    id: overrides.id ?? 'rule-1',
    name: overrides.name ?? 'Test Rule',
    category: overrides.category ?? 'cpu',
    condition: overrides.condition ?? {
      metric: 'usage',
      operator: '>',
      threshold: 80,
    },
    severity: overrides.severity ?? 'warning',
    enabled: overrides.enabled ?? true,
    cooldown: overrides.cooldown ?? 60,
  };
}

describe('alertEngine', () => {
  // 각 테스트 전에 쿨다운 초기화
  beforeEach(() => {
    resetCooldowns();
  });

  describe('evaluateMetrics - CPU 조건 평가', () => {
    it('CPU > threshold일 때 알림을 생성해야 한다', () => {
      const metrics = createMockMetrics({ cpuUsage: 85 });
      const rules = [createMockRule({
        id: 'cpu-high',
        category: 'cpu',
        condition: { metric: 'usage', operator: '>', threshold: 80 },
      })];

      const alerts = evaluateMetrics(metrics, rules);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].ruleId).toBe('cpu-high');
      expect(alerts[0].category).toBe('cpu');
      expect(alerts[0].value).toBe(85);
    });

    it('CPU <= threshold일 때 알림을 생성하지 않아야 한다', () => {
      const metrics = createMockMetrics({ cpuUsage: 75 });
      const rules = [createMockRule({
        category: 'cpu',
        condition: { metric: 'usage', operator: '>', threshold: 80 },
      })];

      const alerts = evaluateMetrics(metrics, rules);

      expect(alerts).toHaveLength(0);
    });

    it('CPU == threshold (경계값)일 때 > 조건은 알림을 생성하지 않아야 한다', () => {
      const metrics = createMockMetrics({ cpuUsage: 80 });
      const rules = [createMockRule({
        category: 'cpu',
        condition: { metric: 'usage', operator: '>', threshold: 80 },
      })];

      const alerts = evaluateMetrics(metrics, rules);

      expect(alerts).toHaveLength(0);
    });

    it('CPU >= threshold (경계값)일 때 >= 조건은 알림을 생성해야 한다', () => {
      const metrics = createMockMetrics({ cpuUsage: 80 });
      const rules = [createMockRule({
        category: 'cpu',
        condition: { metric: 'usage', operator: '>=', threshold: 80 },
      })];

      const alerts = evaluateMetrics(metrics, rules);

      expect(alerts).toHaveLength(1);
    });
  });

  describe('evaluateMetrics - Memory 조건 평가', () => {
    it('Memory > 90%일 때 알림을 생성해야 한다', () => {
      const metrics = createMockMetrics({ memoryUsage: 95 });
      const rules = [createMockRule({
        id: 'memory-critical',
        category: 'memory',
        condition: { metric: 'usage', operator: '>', threshold: 90 },
        severity: 'critical',
      })];

      const alerts = evaluateMetrics(metrics, rules);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].category).toBe('memory');
      expect(alerts[0].severity).toBe('critical');
    });

    it('Memory <= 90%일 때 알림을 생성하지 않아야 한다', () => {
      const metrics = createMockMetrics({ memoryUsage: 85 });
      const rules = [createMockRule({
        category: 'memory',
        condition: { metric: 'usage', operator: '>', threshold: 90 },
      })];

      const alerts = evaluateMetrics(metrics, rules);

      expect(alerts).toHaveLength(0);
    });
  });

  describe('evaluateMetrics - Disk 조건 평가', () => {
    it('Disk > threshold일 때 알림을 생성해야 한다', () => {
      const metrics = createMockMetrics({ diskUsage: 95 });
      const rules = [createMockRule({
        id: 'disk-full',
        category: 'disk',
        condition: { metric: 'usage', operator: '>', threshold: 85 },
        severity: 'critical',
      })];

      const alerts = evaluateMetrics(metrics, rules);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].category).toBe('disk');
    });
  });

  describe('evaluateMetrics - 다중 규칙 평가', () => {
    it('여러 규칙이 동시에 트리거될 수 있어야 한다', () => {
      const metrics = createMockMetrics({
        cpuUsage: 90,
        memoryUsage: 95,
      });
      const rules = [
        createMockRule({
          id: 'cpu-high',
          category: 'cpu',
          condition: { metric: 'usage', operator: '>', threshold: 80 },
        }),
        createMockRule({
          id: 'memory-critical',
          category: 'memory',
          condition: { metric: 'usage', operator: '>', threshold: 90 },
        }),
      ];

      const alerts = evaluateMetrics(metrics, rules);

      expect(alerts).toHaveLength(2);
      expect(alerts.map(a => a.ruleId)).toContain('cpu-high');
      expect(alerts.map(a => a.ruleId)).toContain('memory-critical');
    });

    it('조건을 만족하는 규칙만 알림을 생성해야 한다', () => {
      const metrics = createMockMetrics({
        cpuUsage: 90,
        memoryUsage: 50,
      });
      const rules = [
        createMockRule({
          id: 'cpu-high',
          category: 'cpu',
          condition: { metric: 'usage', operator: '>', threshold: 80 },
        }),
        createMockRule({
          id: 'memory-critical',
          category: 'memory',
          condition: { metric: 'usage', operator: '>', threshold: 90 },
        }),
      ];

      const alerts = evaluateMetrics(metrics, rules);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].ruleId).toBe('cpu-high');
    });
  });

  describe('evaluateMetrics - 비활성화된 규칙', () => {
    it('비활성화된 규칙은 평가하지 않아야 한다', () => {
      const metrics = createMockMetrics({ cpuUsage: 90 });
      const rules = [createMockRule({
        category: 'cpu',
        condition: { metric: 'usage', operator: '>', threshold: 80 },
        enabled: false,
      })];

      const alerts = evaluateMetrics(metrics, rules);

      expect(alerts).toHaveLength(0);
    });
  });

  describe('evaluateMetrics - 쿨다운 메커니즘', () => {
    it('쿨다운 기간 중에는 중복 알림을 생성하지 않아야 한다', () => {
      const metrics = createMockMetrics({ cpuUsage: 90 });
      const rules = [createMockRule({
        id: 'cpu-high',
        category: 'cpu',
        condition: { metric: 'usage', operator: '>', threshold: 80 },
        cooldown: 300, // 5분
      })];

      // 첫 번째 평가 - 알림 생성됨
      const firstAlerts = evaluateMetrics(metrics, rules);
      expect(firstAlerts).toHaveLength(1);

      // 두 번째 평가 (쿨다운 중) - 알림 생성 안됨
      const secondAlerts = evaluateMetrics(metrics, rules);
      expect(secondAlerts).toHaveLength(0);
    });

    it('resetCooldowns 호출 후 알림이 다시 생성되어야 한다', () => {
      const metrics = createMockMetrics({ cpuUsage: 90 });
      const rules = [createMockRule({
        id: 'cpu-high',
        category: 'cpu',
        condition: { metric: 'usage', operator: '>', threshold: 80 },
        cooldown: 300,
      })];

      // 첫 번째 평가
      evaluateMetrics(metrics, rules);

      // 쿨다운 초기화
      resetCooldowns();

      // 다시 평가 - 알림 생성됨
      const alerts = evaluateMetrics(metrics, rules);
      expect(alerts).toHaveLength(1);
    });

    it('resetRuleCooldown으로 특정 규칙 쿨다운만 초기화해야 한다', () => {
      const metrics = createMockMetrics({ cpuUsage: 90, memoryUsage: 95 });
      const rules = [
        createMockRule({
          id: 'cpu-high',
          category: 'cpu',
          condition: { metric: 'usage', operator: '>', threshold: 80 },
          cooldown: 300,
        }),
        createMockRule({
          id: 'memory-critical',
          category: 'memory',
          condition: { metric: 'usage', operator: '>', threshold: 90 },
          cooldown: 300,
        }),
      ];

      // 첫 번째 평가 - 두 알림 모두 생성
      const firstAlerts = evaluateMetrics(metrics, rules);
      expect(firstAlerts).toHaveLength(2);

      // cpu-high 쿨다운만 초기화
      resetRuleCooldown('cpu-high');

      // 다시 평가 - cpu-high만 알림 생성
      const secondAlerts = evaluateMetrics(metrics, rules);
      expect(secondAlerts).toHaveLength(1);
      expect(secondAlerts[0].ruleId).toBe('cpu-high');
    });
  });

  describe('evaluateMetrics - 알림 메시지 포맷', () => {
    it('알림 메시지에 카테고리 이름, 값, 임계값이 포함되어야 한다', () => {
      const metrics = createMockMetrics({ cpuUsage: 85 });
      const rules = [createMockRule({
        category: 'cpu',
        condition: { metric: 'usage', operator: '>', threshold: 80 },
      })];

      const alerts = evaluateMetrics(metrics, rules);

      expect(alerts[0].message).toContain('CPU');
      expect(alerts[0].message).toContain('85');
      expect(alerts[0].message).toContain('80');
    });

    it('한글 카테고리 이름이 올바르게 포맷되어야 한다', () => {
      const metrics = createMockMetrics({ memoryUsage: 95 });
      const rules = [createMockRule({
        category: 'memory',
        condition: { metric: 'usage', operator: '>', threshold: 90 },
      })];

      const alerts = evaluateMetrics(metrics, rules);

      expect(alerts[0].message).toContain('메모리');
    });
  });

  describe('evaluateMetrics - 다양한 연산자', () => {
    it('< 연산자가 올바르게 동작해야 한다', () => {
      const metrics = createMockMetrics({ cpuUsage: 10 });
      const rules = [createMockRule({
        category: 'cpu',
        condition: { metric: 'usage', operator: '<', threshold: 20 },
      })];

      const alerts = evaluateMetrics(metrics, rules);

      expect(alerts).toHaveLength(1);
    });

    it('<= 연산자가 경계값에서 올바르게 동작해야 한다', () => {
      const metrics = createMockMetrics({ cpuUsage: 20 });
      const rules = [createMockRule({
        category: 'cpu',
        condition: { metric: 'usage', operator: '<=', threshold: 20 },
      })];

      const alerts = evaluateMetrics(metrics, rules);

      expect(alerts).toHaveLength(1);
    });

    it('== 연산자가 올바르게 동작해야 한다', () => {
      const metrics = createMockMetrics({ cpuUsage: 50 });
      const rules = [createMockRule({
        category: 'cpu',
        condition: { metric: 'usage', operator: '==', threshold: 50 },
      })];

      const alerts = evaluateMetrics(metrics, rules);

      expect(alerts).toHaveLength(1);
    });
  });

  describe('evaluateMetrics - 알림 속성 검증', () => {
    it('생성된 알림이 올바른 구조를 가져야 한다', () => {
      const metrics = createMockMetrics({ cpuUsage: 90 });
      const rules = [createMockRule({
        id: 'cpu-high',
        name: 'CPU 높음 경고',
        category: 'cpu',
        condition: { metric: 'usage', operator: '>', threshold: 80 },
        severity: 'warning',
      })];

      const alerts = evaluateMetrics(metrics, rules);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        ruleId: 'cpu-high',
        ruleName: 'CPU 높음 경고',
        category: 'cpu',
        severity: 'warning',
        status: 'active',
        value: 90,
        threshold: 80,
      });
      expect(alerts[0].message).toBeDefined();
    });
  });
});

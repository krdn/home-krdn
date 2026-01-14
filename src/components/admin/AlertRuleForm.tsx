'use client';

import { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAlertStore } from '@/stores/alertStore';
import { Button } from '@/components/ui/Button';
import { X, Bell, ChevronDown } from 'lucide-react';
import type { AlertRule, AlertCategory, AlertSeverity, AlertOperator } from '@/types/alert';

/**
 * 알림 규칙 추가/수정 폼
 * Radix Dialog 기반의 규칙 편집 폼 컴포넌트입니다.
 */

// 카테고리 옵션
const categories: { value: AlertCategory; label: string; metrics: string[] }[] = [
  { value: 'cpu', label: 'CPU', metrics: ['usage'] },
  { value: 'memory', label: '메모리', metrics: ['usage'] },
  { value: 'disk', label: '디스크', metrics: ['usage'] },
  { value: 'network', label: '네트워크', metrics: ['rxBytes', 'txBytes'] },
  { value: 'container', label: '컨테이너', metrics: ['count', 'stopped'] },
];

// 메트릭 레이블
const metricLabels: Record<string, string> = {
  usage: '사용률 (%)',
  rxBytes: '수신 바이트',
  txBytes: '송신 바이트',
  count: '컨테이너 수',
  stopped: '중지된 컨테이너',
};

// 심각도 옵션
const severities: { value: AlertSeverity; label: string; color: string }[] = [
  { value: 'info', label: '정보', color: 'bg-blue-500' },
  { value: 'warning', label: '경고', color: 'bg-yellow-500' },
  { value: 'critical', label: '심각', color: 'bg-red-500' },
];

// 연산자 옵션
const operators: { value: AlertOperator; label: string }[] = [
  { value: '>', label: '>' },
  { value: '>=', label: '>=' },
  { value: '<', label: '<' },
  { value: '<=', label: '<=' },
  { value: '==', label: '=' },
];

// 쿨다운 프리셋 (초 단위)
const cooldownPresets = [
  { value: 60, label: '1분' },
  { value: 300, label: '5분' },
  { value: 600, label: '10분' },
  { value: 1800, label: '30분' },
  { value: 3600, label: '1시간' },
];

interface FormData {
  name: string;
  category: AlertCategory;
  metric: string;
  operator: AlertOperator;
  threshold: number;
  severity: AlertSeverity;
  cooldown: number;
}

const defaultFormData: FormData = {
  name: '',
  category: 'cpu',
  metric: 'usage',
  operator: '>',
  threshold: 90,
  severity: 'warning',
  cooldown: 300,
};

interface AlertRuleFormProps {
  rule?: AlertRule;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlertRuleForm({ rule, open, onOpenChange }: AlertRuleFormProps) {
  const { addRule, updateRule } = useAlertStore();
  const isEditing = !!rule;

  // 폼 데이터 상태
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // 규칙이 변경되면 폼 데이터 초기화
  useEffect(() => {
    if (open) {
      if (rule) {
        setFormData({
          name: rule.name,
          category: rule.category,
          metric: rule.condition.metric,
          operator: rule.condition.operator,
          threshold: rule.condition.threshold,
          severity: rule.severity,
          cooldown: rule.cooldown,
        });
      } else {
        setFormData(defaultFormData);
      }
      setErrors({});
    }
  }, [open, rule]);

  // 현재 카테고리의 메트릭 목록
  const currentMetrics = categories.find((c) => c.value === formData.category)?.metrics ?? [];

  // 카테고리 변경 시 첫 번째 메트릭으로 설정
  const handleCategoryChange = useCallback((category: AlertCategory) => {
    const categoryMetrics = categories.find((c) => c.value === category)?.metrics ?? [];
    setFormData((prev) => ({
      ...prev,
      category,
      metric: categoryMetrics[0] ?? 'usage',
    }));
  }, []);

  // 폼 유효성 검사
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = '규칙 이름을 입력해주세요';
    }

    if (formData.threshold < 0 || formData.threshold > 100) {
      newErrors.threshold = '0~100 사이의 값을 입력해주세요';
    }

    if (formData.cooldown < 0) {
      newErrors.cooldown = '쿨다운 시간은 0 이상이어야 합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // 폼 제출
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) return;

      const ruleData = {
        name: formData.name.trim(),
        category: formData.category,
        condition: {
          metric: formData.metric,
          operator: formData.operator,
          threshold: formData.threshold,
        },
        severity: formData.severity,
        enabled: true,
        cooldown: formData.cooldown,
      };

      if (rule) {
        updateRule(rule.id, ruleData);
      } else {
        addRule(ruleData);
      }

      onOpenChange(false);
    },
    [formData, rule, addRule, updateRule, onOpenChange, validateForm]
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-lg border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {/* 헤더 */}
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="flex items-center gap-2 text-lg font-semibold">
              <Bell className="h-5 w-5 text-primary" />
              {isEditing ? '규칙 수정' : '새 알림 규칙'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-full p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 규칙 이름 */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="rule-name">
                규칙 이름
              </label>
              <input
                id="rule-name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="예: CPU 위험 알림"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* 카테고리 & 메트릭 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="category">
                  카테고리
                </label>
                <div className="relative">
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      handleCategoryChange(e.target.value as AlertCategory)
                    }
                    className="w-full appearance-none rounded-md border bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="metric">
                  메트릭
                </label>
                <div className="relative">
                  <select
                    id="metric"
                    value={formData.metric}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, metric: e.target.value }))
                    }
                    className="w-full appearance-none rounded-md border bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {currentMetrics.map((metric) => (
                      <option key={metric} value={metric}>
                        {metricLabels[metric] ?? metric}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* 연산자 & 임계값 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="operator">
                  조건
                </label>
                <div className="relative">
                  <select
                    id="operator"
                    value={formData.operator}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        operator: e.target.value as AlertOperator,
                      }))
                    }
                    className="w-full appearance-none rounded-md border bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {operators.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="threshold">
                  임계값
                </label>
                <input
                  id="threshold"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.threshold}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      threshold: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.threshold && (
                  <p className="text-xs text-destructive">{errors.threshold}</p>
                )}
              </div>
            </div>

            {/* 심각도 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">심각도</label>
              <div className="flex gap-2">
                {severities.map((sev) => (
                  <button
                    key={sev.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, severity: sev.value }))
                    }
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-all ${
                      formData.severity === sev.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${sev.color}`}
                    />
                    {sev.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 쿨다운 시간 */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="cooldown">
                쿨다운 시간
              </label>
              <div className="flex flex-wrap gap-2">
                {cooldownPresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, cooldown: preset.value }))
                    }
                    className={`rounded-md border px-3 py-1.5 text-sm transition-all ${
                      formData.cooldown === preset.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                동일 규칙의 알림이 다시 발생하기까지 대기하는 시간입니다.
              </p>
              {errors.cooldown && (
                <p className="text-xs text-destructive">{errors.cooldown}</p>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-end gap-3 pt-4">
              <Dialog.Close asChild>
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Dialog.Close>
              <Button type="submit">
                {isEditing ? '수정' : '추가'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

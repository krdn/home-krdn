'use client';

import { memo, useCallback } from 'react';
import { useAlertStore } from '@/stores/alertStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Bell, Edit2, Trash2, Plus, Power, PowerOff } from 'lucide-react';
import type { AlertRule, AlertSeverity, AlertCategory } from '@/types/alert';

/**
 * 알림 규칙 목록 패널
 * 알림 규칙을 표시하고 관리할 수 있는 패널 컴포넌트입니다.
 */

// 심각도별 배지 스타일
const severityBadgeVariant: Record<AlertSeverity, 'default' | 'warning' | 'destructive'> = {
  info: 'default',
  warning: 'warning',
  critical: 'destructive',
};

// 심각도 한국어 레이블
const severityLabels: Record<AlertSeverity, string> = {
  info: '정보',
  warning: '경고',
  critical: '심각',
};

// 카테고리 한국어 레이블
const categoryLabels: Record<AlertCategory, string> = {
  cpu: 'CPU',
  memory: '메모리',
  disk: '디스크',
  network: '네트워크',
  container: '컨테이너',
  log: '로그',
};

// 연산자 표시 문자
const operatorSymbols: Record<string, string> = {
  '>': '>',
  '<': '<',
  '>=': '>=',
  '<=': '<=',
  '==': '=',
};

interface RuleItemProps {
  rule: AlertRule;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * 개별 규칙 아이템 컴포넌트
 */
const RuleItem = memo(function RuleItem({
  rule,
  onToggle,
  onEdit,
  onDelete,
}: RuleItemProps) {
  // 조건 텍스트 포맷
  const conditionText = `${rule.condition.metric} ${operatorSymbols[rule.condition.operator]} ${rule.condition.threshold}%`;

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-4 transition-all duration-200 ${
        rule.enabled
          ? 'border-border bg-card'
          : 'border-muted bg-muted/30 opacity-60'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* 규칙 활성화 상태 아이콘 */}
        <button
          onClick={onToggle}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            rule.enabled
              ? 'bg-success/20 text-success hover:bg-success/30'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
          title={rule.enabled ? '비활성화' : '활성화'}
        >
          {rule.enabled ? (
            <Power className="h-4 w-4" />
          ) : (
            <PowerOff className="h-4 w-4" />
          )}
        </button>

        {/* 규칙 정보 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{rule.name}</span>
            <Badge variant={severityBadgeVariant[rule.severity]}>
              {severityLabels[rule.severity]}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">
              {categoryLabels[rule.category]}
            </span>
            <span>{conditionText}</span>
            <span className="text-xs">
              (쿨다운: {Math.floor(rule.cooldown / 60)}분)
            </span>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          title="수정"
          className="h-8 w-8"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          title="삭제"
          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

interface AlertRulesPanelProps {
  onEdit: (rule: AlertRule) => void;
  onAdd: () => void;
}

/**
 * 알림 규칙 목록 패널
 */
export const AlertRulesPanel = memo(function AlertRulesPanel({
  onEdit,
  onAdd,
}: AlertRulesPanelProps) {
  const { rules, toggleRule, deleteRule } = useAlertStore();

  // 삭제 확인 핸들러
  const handleDelete = useCallback((rule: AlertRule) => {
    if (window.confirm(`"${rule.name}" 규칙을 삭제하시겠습니까?`)) {
      deleteRule(rule.id);
    }
  }, [deleteRule]);

  // 규칙 통계
  const enabledCount = rules.filter((r) => r.enabled).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle>알림 규칙</CardTitle>
          <span className="text-sm text-muted-foreground">
            ({enabledCount}/{rules.length} 활성)
          </span>
        </div>
        <Button onClick={onAdd} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          규칙 추가
        </Button>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              알림 규칙이 없습니다.
            </p>
            <Button onClick={onAdd} variant="outline" className="mt-4">
              <Plus className="mr-1 h-4 w-4" />
              첫 번째 규칙 만들기
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <RuleItem
                key={rule.id}
                rule={rule}
                onToggle={() => toggleRule(rule.id)}
                onEdit={() => onEdit(rule)}
                onDelete={() => handleDelete(rule)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

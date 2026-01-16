'use client';

import { memo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Power, PowerOff, Edit2, Trash2, Search, FileText, BarChart3, Globe, User } from 'lucide-react';
import type { LogAlertRule } from '@/types/log-alert';
import { formatConditionSummary } from '@/types/log-alert';
import type { AlertSeverity } from '@/types/alert';

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

// 조건 타입별 아이콘
const conditionTypeIcons = {
  keyword: Search,
  pattern: FileText,
  frequency: BarChart3,
};

// 조건 타입 레이블
const conditionTypeLabels = {
  keyword: '키워드',
  pattern: '패턴',
  frequency: '빈도',
};

interface LogAlertRuleCardProps {
  rule: LogAlertRule;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggle?: () => void;
  isToggling?: boolean;
}

/**
 * 로그 알림 규칙 카드 컴포넌트
 * 개별 로그 알림 규칙을 카드 형태로 표시합니다.
 */
export const LogAlertRuleCard = memo(function LogAlertRuleCard({
  rule,
  onEdit,
  onDelete,
  onToggle,
  isToggling = false,
}: LogAlertRuleCardProps) {
  const ConditionIcon = conditionTypeIcons[rule.condition.type];
  const isGlobal = !rule.userId;

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-4 transition-all duration-200 ${
        rule.enabled
          ? 'border-border bg-card'
          : 'border-muted bg-muted/30 opacity-60'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* 활성화 토글 버튼 */}
        <button
          onClick={onToggle}
          disabled={isToggling}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${
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
            <Badge variant={severityBadgeVariant[rule.severity as AlertSeverity]}>
              {severityLabels[rule.severity as AlertSeverity]}
            </Badge>
            {/* 전역/개인 규칙 표시 */}
            {isGlobal ? (
              <span className="flex items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-xs text-blue-600 dark:text-blue-400">
                <Globe className="h-3 w-3" />
                전역
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded bg-green-500/10 px-1.5 py-0.5 text-xs text-green-600 dark:text-green-400">
                <User className="h-3 w-3" />
                개인
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {/* 조건 타입 배지 */}
            <span className="flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs">
              <ConditionIcon className="h-3 w-3" />
              {conditionTypeLabels[rule.condition.type]}
            </span>
            {/* 조건 요약 */}
            <span>{formatConditionSummary(rule.condition)}</span>
            {/* 쿨다운 */}
            <span className="text-xs">
              (쿨다운: {Math.floor(rule.cooldown / 60)}분)
            </span>
          </div>
          {/* 설명 (있으면 표시) */}
          {rule.description && (
            <p className="text-xs text-muted-foreground/80">{rule.description}</p>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-2">
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            title="수정"
            className="h-8 w-8"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            title="삭제"
            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
});

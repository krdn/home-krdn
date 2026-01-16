'use client';

import { memo, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BellRing, Plus, Loader2 } from 'lucide-react';
import { LogAlertRuleCard } from './LogAlertRuleCard';
import { LogAlertRuleForm } from './LogAlertRuleForm';
import {
  useLogAlertRules,
  useCreateLogAlertRule,
  useUpdateLogAlertRule,
  useDeleteLogAlertRule,
  useToggleLogAlertRule,
} from '@/hooks/useLogAlerts';
import type { LogAlertRule, NewLogAlertRule } from '@/types/log-alert';

interface LogAlertRuleListProps {
  className?: string;
  isAdmin?: boolean;
}

/**
 * 로그 알림 규칙 목록 컴포넌트
 * 규칙 목록 표시, 추가/수정/삭제/토글 기능 제공
 */
export const LogAlertRuleList = memo(function LogAlertRuleList({
  className,
  isAdmin = false,
}: LogAlertRuleListProps) {
  // 상태
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LogAlertRule | null>(null);

  // 쿼리 및 뮤테이션
  const { data, isLoading, error } = useLogAlertRules();
  const createMutation = useCreateLogAlertRule();
  const updateMutation = useUpdateLogAlertRule();
  const deleteMutation = useDeleteLogAlertRule();
  const toggleMutation = useToggleLogAlertRule();

  // 폼 열기/닫기
  const handleOpenForm = useCallback(() => {
    setEditingRule(null);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setEditingRule(null);
    setIsFormOpen(false);
  }, []);

  // 수정 모드 열기
  const handleEdit = useCallback((rule: LogAlertRule) => {
    setEditingRule(rule);
    setIsFormOpen(true);
  }, []);

  // 삭제 핸들러
  const handleDelete = useCallback((rule: LogAlertRule) => {
    if (window.confirm(`"${rule.name}" 규칙을 삭제하시겠습니까?`)) {
      deleteMutation.mutate(rule.id);
    }
  }, [deleteMutation]);

  // 토글 핸들러
  const handleToggle = useCallback((rule: LogAlertRule) => {
    toggleMutation.mutate(rule.id);
  }, [toggleMutation]);

  // 폼 제출 핸들러
  const handleSubmit = useCallback(
    (formData: NewLogAlertRule & { global?: boolean }) => {
      if (editingRule) {
        updateMutation.mutate(
          { id: editingRule.id, data: formData },
          { onSuccess: () => handleCloseForm() }
        );
      } else {
        createMutation.mutate(formData, { onSuccess: () => handleCloseForm() });
      }
    },
    [editingRule, createMutation, updateMutation, handleCloseForm]
  );

  // 통계
  const allRules = data?.all || [];
  const enabledCount = allRules.filter((r) => r.enabled).length;

  // 로딩 상태
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-destructive">규칙 목록을 불러오지 못했습니다.</p>
          <p className="text-xs text-muted-foreground mt-1">{(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-primary" />
          <CardTitle>로그 알림 규칙</CardTitle>
          <span className="text-sm text-muted-foreground">
            ({enabledCount}/{allRules.length} 활성)
          </span>
        </div>
        <Button onClick={handleOpenForm} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          규칙 추가
        </Button>
      </CardHeader>
      <CardContent>
        {/* 폼 (열려있을 때만) */}
        {isFormOpen && (
          <div className="mb-6 rounded-lg border bg-muted/30 p-4">
            <h3 className="mb-4 text-lg font-semibold">
              {editingRule ? '규칙 수정' : '새 규칙 추가'}
            </h3>
            <LogAlertRuleForm
              rule={editingRule || undefined}
              onSubmit={handleSubmit}
              onCancel={handleCloseForm}
              isSubmitting={createMutation.isPending || updateMutation.isPending}
              isAdmin={isAdmin}
            />
          </div>
        )}

        {/* 규칙 목록 */}
        {allRules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BellRing className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              로그 알림 규칙이 없습니다.
            </p>
            <Button onClick={handleOpenForm} variant="outline" className="mt-4">
              <Plus className="mr-1 h-4 w-4" />
              첫 번째 규칙 만들기
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 전역 규칙 */}
            {data?.global && data.global.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium uppercase text-muted-foreground">
                  전역 규칙 ({data.global.length})
                </h4>
                {data.global.map((rule) => (
                  <LogAlertRuleCard
                    key={rule.id}
                    rule={rule}
                    onEdit={isAdmin ? () => handleEdit(rule) : undefined}
                    onDelete={isAdmin ? () => handleDelete(rule) : undefined}
                    onToggle={isAdmin ? () => handleToggle(rule) : undefined}
                    isToggling={toggleMutation.isPending}
                  />
                ))}
              </div>
            )}

            {/* 개인 규칙 */}
            {data?.user && data.user.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium uppercase text-muted-foreground">
                  내 규칙 ({data.user.length})
                </h4>
                {data.user.map((rule) => (
                  <LogAlertRuleCard
                    key={rule.id}
                    rule={rule}
                    onEdit={() => handleEdit(rule)}
                    onDelete={() => handleDelete(rule)}
                    onToggle={() => handleToggle(rule)}
                    isToggling={toggleMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

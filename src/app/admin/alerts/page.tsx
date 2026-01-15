'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AlertRulesPanel } from '@/components/admin/AlertRulesPanel';
import { AlertHistoryPanel } from '@/components/admin/AlertHistoryPanel';
import { EmailSettings } from '@/components/admin/EmailSettings';
import { SlackSettings } from '@/components/admin/SlackSettings';
import { Bell, Loader2 } from 'lucide-react';

// Dynamic Import: AlertRuleForm은 402줄의 복잡한 폼이므로 지연 로딩
const AlertRuleForm = dynamic(
  () => import('@/components/admin/AlertRuleForm').then((mod) => mod.AlertRuleForm),
  {
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 rounded-lg bg-card p-4 shadow-lg">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>폼 로딩 중...</span>
        </div>
      </div>
    ),
    ssr: false, // 모달은 클라이언트에서만 필요
  }
);
import type { AlertRule } from '@/types/alert';

/**
 * 알림 설정 페이지
 * 알림 규칙 관리 및 알림 히스토리를 표시합니다.
 */
export default function AlertsPage() {
  // 규칙 편집 상태
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // 규칙 수정 핸들러
  const handleEdit = useCallback((rule: AlertRule) => {
    setEditingRule(rule);
    setIsFormOpen(true);
  }, []);

  // 규칙 추가 핸들러
  const handleAdd = useCallback(() => {
    setEditingRule(null);
    setIsFormOpen(true);
  }, []);

  // 폼 닫기 핸들러
  const handleFormClose = useCallback((open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingRule(null);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">알림 설정</h1>
          <p className="text-sm text-muted-foreground">
            시스템 알림 규칙을 관리하고 알림 히스토리를 확인합니다.
          </p>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 알림 규칙 패널 */}
        <AlertRulesPanel onEdit={handleEdit} onAdd={handleAdd} />

        {/* 알림 히스토리 패널 */}
        <AlertHistoryPanel />
      </div>

      {/* 알림 채널 설정 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EmailSettings />
        <SlackSettings />
      </div>

      {/* 규칙 추가/수정 폼 */}
      <AlertRuleForm
        rule={editingRule ?? undefined}
        open={isFormOpen}
        onOpenChange={handleFormClose}
      />
    </div>
  );
}

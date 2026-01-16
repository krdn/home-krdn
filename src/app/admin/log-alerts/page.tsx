'use client';

/**
 * Admin 로그 알림 규칙 관리 페이지
 *
 * 로그 패턴 기반 알림 규칙을 관리합니다.
 *
 * Phase 38: Log-based Alerts
 *
 * - 키워드 매칭 규칙
 * - 정규식 패턴 규칙
 * - 빈도 기반 규칙
 */

import dynamic from 'next/dynamic';
import { BellRing, Loader2 } from 'lucide-react';
import { AdminOnly } from '@/components/admin/RoleGuard';

// Dynamic Import: LogAlertRuleList 지연 로딩
const LogAlertRuleList = dynamic(
  () => import('@/components/log-alerts').then((mod) => mod.LogAlertRuleList),
  {
    loading: () => (
      <div className="flex items-center justify-center rounded-lg border bg-card p-12">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">로그 알림 규칙 로딩 중...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
);

/**
 * Admin 로그 알림 페이지 컴포넌트
 */
export default function LogAlertsPage() {
  return (
    <AdminOnly
      fallback={
        <p className="p-4 text-muted-foreground">
          로그 알림 규칙 관리 권한이 없습니다. Admin 역할이 필요합니다.
        </p>
      }
    >
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BellRing className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Log Alerts</h1>
            <p className="text-sm text-muted-foreground">
              로그 패턴 기반 알림 규칙 관리
            </p>
          </div>
        </div>

        {/* 규칙 목록 */}
        <LogAlertRuleList isAdmin={true} />

        {/* 안내 메시지 */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <h3 className="font-medium mb-2">알림 규칙 타입</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              <strong>키워드:</strong> 특정 키워드가 로그에 포함될 때 알림
            </li>
            <li>
              <strong>패턴:</strong> 정규식 패턴과 일치하는 로그 발생 시 알림
            </li>
            <li>
              <strong>빈도:</strong> 특정 레벨의 로그가 시간 윈도우 내 N회 이상 발생 시 알림
            </li>
          </ul>
        </div>
      </div>
    </AdminOnly>
  );
}

'use client';

/**
 * Admin 로그 페이지
 *
 * 로그 뷰어 대시보드 - 실시간 로그 조회 및 검색
 *
 * Phase 37: Log Viewer UI
 *
 * - 로그 필터링 (소스/레벨/검색어)
 * - 실시간 스트리밍 모드
 * - 로그 통계 시각화
 * - 가상화된 대용량 로그 목록
 */

import dynamic from 'next/dynamic';
import { ScrollText, Loader2 } from 'lucide-react';
import { AdminOnly } from '@/components/admin/RoleGuard';

// Dynamic Import: LogViewer 지연 로딩 (초기 번들 크기 최적화)
const LogViewer = dynamic(
  () => import('@/components/logs/LogViewer').then((mod) => mod.LogViewer),
  {
    loading: () => (
      <div className="flex items-center justify-center rounded-lg border bg-card p-12">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">로그 뷰어 로딩 중...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
);

/**
 * Admin 로그 페이지 컴포넌트
 */
export default function AdminLogsPage() {
  return (
    <AdminOnly
      fallback={
        <p className="p-4 text-muted-foreground">
          로그 조회 권한이 없습니다. Admin 역할이 필요합니다.
        </p>
      }
    >
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ScrollText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Logs</h1>
            <p className="text-sm text-muted-foreground">
              실시간 로그 조회 및 검색
            </p>
          </div>
        </div>

        {/* 로그 뷰어 */}
        <LogViewer maxHeight={600} />
      </div>
    </AdminOnly>
  );
}

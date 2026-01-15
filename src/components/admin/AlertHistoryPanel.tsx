'use client';

import { memo, useCallback, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAlertStore } from '@/stores/alertStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  History
} from 'lucide-react';
import type { Alert, AlertSeverity, AlertStatus } from '@/types/alert';

/**
 * 알림 히스토리 패널
 * 발생한 알림 목록을 표시하고 관리합니다.
 */

// 심각도별 배지 스타일
const severityBadgeVariant: Record<AlertSeverity, 'default' | 'warning' | 'destructive'> = {
  info: 'default',
  warning: 'warning',
  critical: 'destructive',
};

// 상태별 아이콘 및 스타일
const statusConfig: Record<
  AlertStatus,
  { icon: typeof AlertTriangle; label: string; className: string }
> = {
  active: {
    icon: AlertTriangle,
    label: '활성',
    className: 'text-destructive',
  },
  acknowledged: {
    icon: Clock,
    label: '확인됨',
    className: 'text-warning',
  },
  resolved: {
    icon: CheckCircle2,
    label: '해결됨',
    className: 'text-success',
  },
};

// 시간 포맷팅
function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
}

interface AlertItemProps {
  alert: Alert;
  onAcknowledge: () => void;
  onResolve: () => void;
}

/**
 * 개별 알림 아이템 컴포넌트
 */
const AlertItem = memo(function AlertItem({
  alert,
  onAcknowledge,
  onResolve,
}: AlertItemProps) {
  const StatusIcon = statusConfig[alert.status].icon;

  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-lg border p-4 transition-all duration-200 ${
        alert.status === 'active'
          ? 'border-destructive/30 bg-destructive/5'
          : alert.status === 'acknowledged'
          ? 'border-warning/30 bg-warning/5'
          : 'border-border bg-card opacity-60'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* 상태 아이콘 */}
        <div className={`mt-0.5 ${statusConfig[alert.status].className}`}>
          <StatusIcon className="h-5 w-5" />
        </div>

        {/* 알림 정보 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{alert.ruleName}</span>
            <Badge variant={severityBadgeVariant[alert.severity]} className="text-xs">
              {alert.severity}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{alert.message}</p>
          <p className="text-xs text-muted-foreground">
            {formatTime(alert.createdAt)}
          </p>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-2">
        {alert.status === 'active' && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAcknowledge}
            className="h-8 text-xs"
          >
            확인
          </Button>
        )}
        {alert.status !== 'resolved' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResolve}
            className="h-8 text-xs"
          >
            해결
          </Button>
        )}
      </div>
    </div>
  );
});

// 가상화 상수
const ALERT_ITEM_HEIGHT = 100; // 알림 아이템 높이 (px)
const ALERT_LIST_MAX_HEIGHT = 400; // 최대 리스트 높이 (px)
const ALERT_VIRTUALIZATION_THRESHOLD = 15; // 이 개수 이상일 때 가상화 적용

/**
 * 알림 히스토리 패널
 */
export const AlertHistoryPanel = memo(function AlertHistoryPanel() {
  const { alerts, acknowledgeAlert, resolveAlert, clearResolvedAlerts } =
    useAlertStore();

  // 가상화를 위한 스크롤 컨테이너 ref
  const parentRef = useRef<HTMLDivElement>(null);

  // 정렬: 최신순, 활성 > 확인됨 > 해결됨 - useMemo로 캐싱
  const sortedAlerts = useMemo(() => {
    const statusOrder = { active: 0, acknowledged: 1, resolved: 2 };
    return [...alerts].sort((a, b) => {
      // 상태 우선순위
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      // 같은 상태면 시간순
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [alerts]);

  // 알림 통계 - useMemo로 캐싱
  const { activeCount, resolvedCount } = useMemo(() => ({
    activeCount: alerts.filter((a) => a.status === 'active').length,
    resolvedCount: alerts.filter((a) => a.status === 'resolved').length,
  }), [alerts]);

  // 해결된 알림 삭제
  const handleClearResolved = useCallback(() => {
    if (resolvedCount > 0 && window.confirm(`해결된 알림 ${resolvedCount}개를 삭제하시겠습니까?`)) {
      clearResolvedAlerts();
    }
  }, [resolvedCount, clearResolvedAlerts]);

  // 가상화 설정 (15개 이상일 때만 활성화)
  const shouldVirtualize = sortedAlerts.length >= ALERT_VIRTUALIZATION_THRESHOLD;
  const virtualizer = useVirtualizer({
    count: sortedAlerts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ALERT_ITEM_HEIGHT,
    overscan: 3,
    enabled: shouldVirtualize,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <CardTitle>알림 히스토리</CardTitle>
          {activeCount > 0 && (
            <Badge variant="destructive" className="ml-1">
              {activeCount}
            </Badge>
          )}
        </div>
        {resolvedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearResolved}
            className="h-8 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-1 h-3 w-3" />
            해결됨 삭제
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="mb-3 h-12 w-12 text-success/50" />
            <p className="text-sm text-muted-foreground">
              알림이 없습니다. 모든 시스템이 정상입니다.
            </p>
          </div>
        ) : shouldVirtualize ? (
          // 가상화 리스트: 15개 이상일 때 사용
          <div
            ref={parentRef}
            className="overflow-auto scrollbar-thin"
            style={{
              height: Math.min(
                sortedAlerts.length * ALERT_ITEM_HEIGHT,
                ALERT_LIST_MAX_HEIGHT
              ),
            }}
          >
            <div
              style={{
                height: virtualizer.getTotalSize(),
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const alert = sortedAlerts[virtualRow.index];
                return (
                  <div
                    key={alert.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: virtualRow.size,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="pb-3 pr-1"
                  >
                    <AlertItem
                      alert={alert}
                      onAcknowledge={() => acknowledgeAlert(alert.id)}
                      onResolve={() => resolveAlert(alert.id)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // 일반 리스트: 15개 미만일 때 사용
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {sortedAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onAcknowledge={() => acknowledgeAlert(alert.id)}
                onResolve={() => resolveAlert(alert.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

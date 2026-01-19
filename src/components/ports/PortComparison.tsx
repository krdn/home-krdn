'use client';

/**
 * PortComparison 컴포넌트
 *
 * 등록 포트 vs 실제 포트 비교 결과를 시각화합니다.
 * 정상/주의/미등록 3가지 섹션으로 분류하여 표시합니다.
 *
 * Phase 43: Port Scanner & Guide
 */

import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  AlertCircle,
  Clock,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { HelpButton } from '@/components/help';
import { usePortComparison } from '@/hooks/usePortScanner';

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * ISO 8601 형식의 시간을 상대 시간으로 변환합니다.
 */
function formatRelativeTime(isoString?: string): string {
  if (!isoString) return '-';

  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return '방금 전';
  if (diffSec < 60) return `${diffSec}초 전`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}일 전`;
}

/**
 * 날짜를 간단한 형식으로 포맷합니다.
 */
function formatDate(dateString?: string | Date): string {
  if (!dateString) return '-';

  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// ============================================================
// 컴포넌트
// ============================================================

export function PortComparison() {
  const {
    summary,
    registeredAndActive,
    registeredButInactive,
    unregisteredButActive,
    comparedAt,
    isLoading,
    isFetching,
    error,
    refetch,
  } = usePortComparison();

  // 로딩 상태
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <p className="mb-2 font-medium">포트 비교에 실패했습니다</p>
          <p className="mb-4 text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <CheckCircle className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">포트 비교</h2>
              <HelpButton helpId="widget-port-comparison" size="sm" />
            </div>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              마지막 비교: {formatRelativeTime(comparedAt)}
            </p>
          </div>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          disabled={isFetching}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{summary.totalRegistered}</div>
            <div className="text-sm text-muted-foreground">등록 총 포트</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {summary.activeCount}
            </div>
            <div className="text-sm text-muted-foreground">활성 포트</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {summary.inactiveCount}
            </div>
            <div className="text-sm text-muted-foreground">비활성 포트</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {summary.unregisteredCount}
            </div>
            <div className="text-sm text-muted-foreground">미등록 포트</div>
          </CardContent>
        </Card>
      </div>

      {/* 정상: 등록 + 활성 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-green-600">
            <CheckCircle className="h-4 w-4" />
            정상: 등록 + 활성 ({registeredAndActive.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {registeredAndActive.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              활성 상태인 등록 포트가 없습니다
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">포트</th>
                    <th className="pb-3 pr-4 font-medium">프로젝트</th>
                    <th className="pb-3 pr-4 font-medium">컨테이너</th>
                    <th className="pb-3 font-medium">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredAndActive.map(({ registered, docker }) => (
                    <tr
                      key={registered.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="py-3 pr-4">
                        <span className="font-mono font-semibold text-green-600">
                          {registered.port}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium">{registered.projectName}</p>
                          {registered.description && (
                            <p className="max-w-xs truncate text-xs text-muted-foreground">
                              {registered.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        {docker ? (
                          <span className="text-sm">{docker.containerName}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3">
                        <Badge variant="success">활성</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 주의: 등록 + 비활성 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-yellow-600">
            <AlertTriangle className="h-4 w-4" />
            주의: 등록 + 비활성 ({registeredButInactive.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-start gap-2 rounded-md bg-yellow-500/10 p-3">
            <Info className="mt-0.5 h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              등록되었지만 현재 실행 중이지 않은 포트입니다. 서비스가 중지되었거나
              컨테이너가 실행되지 않은 상태일 수 있습니다.
            </p>
          </div>
          {registeredButInactive.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              비활성 상태인 등록 포트가 없습니다
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">포트</th>
                    <th className="pb-3 pr-4 font-medium">프로젝트</th>
                    <th className="pb-3 pr-4 font-medium">환경</th>
                    <th className="pb-3 font-medium">마지막 업데이트</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredButInactive.map((port) => (
                    <tr
                      key={port.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="py-3 pr-4">
                        <span className="font-mono font-semibold text-yellow-600">
                          {port.port}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium">{port.projectName}</p>
                          {port.description && (
                            <p className="max-w-xs truncate text-xs text-muted-foreground">
                              {port.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary">{port.environment}</Badge>
                      </td>
                      <td className="py-3">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(port.updatedAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 미등록: 미등록 + 활성 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-orange-600">
            <HelpCircle className="h-4 w-4" />
            미등록: 미등록 + 활성 ({unregisteredButActive.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-start gap-2 rounded-md bg-orange-500/10 p-3">
            <Info className="mt-0.5 h-4 w-4 text-orange-600" />
            <p className="text-sm text-orange-700 dark:text-orange-400">
              PortRegistry에 등록되지 않은 활성 포트입니다. 관리를 위해 등록을
              권장합니다.
            </p>
          </div>
          {unregisteredButActive.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              미등록 활성 포트가 없습니다
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">호스트 포트</th>
                    <th className="pb-3 pr-4 font-medium">컨테이너</th>
                    <th className="pb-3 font-medium">컨테이너 포트</th>
                  </tr>
                </thead>
                <tbody>
                  {unregisteredButActive.map(({ docker }, index) => (
                    <tr
                      key={`${docker.containerId}-${docker.hostPort}-${index}`}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-orange-600">
                            {docker.hostPort}
                          </span>
                          <Badge variant="warning">미등록</Badge>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium">{docker.containerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {docker.containerId}
                          </p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="font-mono text-muted-foreground">
                          {docker.containerPort}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

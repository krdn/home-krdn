'use client';

/**
 * PortScanner 컴포넌트
 *
 * 실시간 포트 스캔 결과를 표시합니다.
 * Docker 컨테이너의 포트 바인딩과 시스템 포트를 조회합니다.
 *
 * Phase 43: Port Scanner & Guide
 */

import { RefreshCw, Container, Server, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePortScan } from '@/hooks/usePortScanner';

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * ISO 8601 형식의 시간을 상대 시간으로 변환합니다.
 * @param isoString ISO 8601 형식의 시간 문자열
 * @returns 상대 시간 문자열 (예: "방금 전", "1분 전")
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

// ============================================================
// 컴포넌트
// ============================================================

export function PortScanner() {
  const { docker, system, scannedAt, isLoading, isFetching, error, refetch } = usePortScan();

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
          <p className="mb-2 font-medium">포트 스캔에 실패했습니다</p>
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <Container className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">포트 스캐너</h2>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              마지막 스캔: {formatRelativeTime(scannedAt)}
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

      {/* Docker 포트 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Container className="h-4 w-4" />
            Docker 컨테이너 포트 ({docker.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {docker.length === 0 ? (
            <div className="py-8 text-center">
              <Container className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">실행 중인 컨테이너가 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">호스트 포트</th>
                    <th className="pb-3 pr-4 font-medium">컨테이너 포트</th>
                    <th className="pb-3 pr-4 font-medium">컨테이너</th>
                    <th className="pb-3 pr-4 font-medium">상태</th>
                    <th className="pb-3 font-medium">프로토콜</th>
                  </tr>
                </thead>
                <tbody>
                  {docker.map((binding, index) => (
                    <tr
                      key={`${binding.containerId}-${binding.hostPort}-${index}`}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="py-3 pr-4">
                        <span className="font-mono font-semibold text-primary">
                          {binding.hostPort}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-mono text-muted-foreground">
                          {binding.containerPort}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium">{binding.containerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {binding.containerId}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={
                            binding.containerState === 'running'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {binding.containerState}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline">{binding.protocol}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 시스템 포트 섹션 (참고용) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4" />
            시스템 포트 (참고) ({system.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            컨테이너 내부에서 실행 중이므로 컨테이너 네임스페이스 포트만 표시됩니다.
            호스트 시스템 포트는 Docker 바인딩을 참고하세요.
          </p>
          {system.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-muted-foreground">시스템 포트 정보가 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">포트</th>
                    <th className="pb-3 pr-4 font-medium">주소</th>
                    <th className="pb-3 font-medium">프로세스</th>
                  </tr>
                </thead>
                <tbody>
                  {system.map((port, index) => (
                    <tr
                      key={`${port.port}-${index}`}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="py-3 pr-4">
                        <span className="font-mono font-semibold">{port.port}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-mono text-muted-foreground">
                          {port.address || '-'}
                        </span>
                      </td>
                      <td className="py-3">
                        {port.process ? (
                          <span className="text-sm">
                            {port.process}
                            {port.pid && (
                              <span className="ml-1 text-muted-foreground">
                                (PID: {port.pid})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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

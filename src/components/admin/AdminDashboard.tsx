'use client';

/**
 * AdminDashboard 컴포넌트
 *
 * Phase 20: User Dashboard Settings
 *
 * 사용자 설정에 따라 위젯을 동적으로 렌더링하는 대시보드입니다.
 * WidgetCustomizer와 연동하여 위젯 순서와 가시성을 조절합니다.
 */

import { useEffect, useMemo, memo, type ReactNode } from 'react';
import {
  Activity,
  Bell,
  Box,
  Rocket,
  Code,
  FolderKanban,
  Layers,
  Network,
  Link2,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/services/StatusBadge';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { ContainerStats } from '@/components/admin/ContainerStats';
import { LazyMetricsCharts } from '@/components/admin/LazyMetricsCharts';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { RoleBanner } from '@/components/admin/RoleBanner';
import { WidgetCustomizer } from '@/components/admin/WidgetCustomizer';
import { getRunningServices } from '@/config/services';
import { getServiceProdUrl, getServiceDevUrl } from '@/lib/service-utils';
import { useDashboardStore, parseDashboardLayout } from '@/stores/dashboardStore';
import { useSettings } from '@/hooks/useSettings';
import type { WidgetId } from '@/types/dashboard';

/**
 * Running Services 카드 컴포넌트
 * memo: 서비스 데이터가 변경되지 않으면 리렌더링 방지
 */
const RunningServicesCard = memo(function RunningServicesCard() {
  const runningServices = getRunningServices();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" aria-hidden="true" />
          Running Services
        </CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/services">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {runningServices.length === 0 ? (
          <p className="text-muted-foreground">No services running</p>
        ) : (
          <div className="space-y-3">
            {runningServices.slice(0, 5).map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={service.status} showLabel={false} />
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {service.port ? `Port ${service.port}` : 'No port'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {getServiceProdUrl(service) && (
                    <Button asChild variant="ghost" size="sm">
                      <a
                        href={getServiceProdUrl(service)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                        aria-label={`${service.name} 운영 환경 열기 (새 탭)`}
                        title="Production"
                      >
                        <Rocket className="h-4 w-4 text-green-500" aria-hidden="true" />
                      </a>
                    </Button>
                  )}
                  {getServiceDevUrl(service) && (
                    <Button asChild variant="ghost" size="sm">
                      <a
                        href={getServiceDevUrl(service)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                        aria-label={`${service.name} 개발 환경 열기 (새 탭)`}
                        title="Development"
                      >
                        <Code className="h-4 w-4 text-orange-500" aria-hidden="true" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {runningServices.length > 5 && (
              <p className="text-center text-sm text-muted-foreground">
                +{runningServices.length - 5} more services
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

RunningServicesCard.displayName = 'RunningServicesCard';

/**
 * URL Quick Reference 위젯 컴포넌트
 * 실행 중인 서비스의 Production/Development URL을 테이블 형태로 표시
 */
const UrlQuickReference = memo(function UrlQuickReference() {
  const services = getRunningServices().filter(
    (s) => s.urls || s.port || s.url
  );

  if (services.length === 0) {
    return null;
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" aria-hidden="true" />
          URL Quick Reference
        </CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link href="/ports">URL Registry</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Service</th>
                <th className="pb-2 font-medium">Port</th>
                <th className="pb-2 font-medium">Production</th>
                <th className="pb-2 font-medium">Development</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {services.map((service) => {
                const prodUrl = getServiceProdUrl(service);
                const devUrl = getServiceDevUrl(service);

                return (
                  <tr key={service.id} className="hover:bg-muted/50">
                    <td className="py-2 pr-4">
                      <span className="font-medium">{service.name}</span>
                    </td>
                    <td className="py-2 pr-4">
                      {service.port && (
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {service.port}
                        </code>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {prodUrl && (
                        <a
                          href={prodUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 hover:underline dark:text-green-400"
                          title="Open production URL"
                        >
                          <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="max-w-[140px] truncate">
                            {prodUrl.replace(/^https?:\/\//, '')}
                          </span>
                        </a>
                      )}
                    </td>
                    <td className="py-2">
                      {devUrl && (
                        <a
                          href={devUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 hover:underline dark:text-orange-400"
                          title="Open development URL"
                        >
                          <Code className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="font-mono text-xs">
                            :{service.port || devUrl.split(':').pop()}
                          </span>
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
});

UrlQuickReference.displayName = 'UrlQuickReference';

/**
 * Quick Links 섹션 컴포넌트
 * memo: 정적 컨텐츠이므로 한 번만 렌더링
 */
const QuickLinksSection = memo(function QuickLinksSection() {
  return (
    <section aria-label="Quick Access">
      <h2 className="mb-4 text-lg font-semibold">Quick Access</h2>
      <nav className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="빠른 링크">
        <Link href="/admin/projects">
          <Card hover className="h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
                <FolderKanban className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Projects</p>
                <p className="text-sm text-muted-foreground">Manage projects</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/alerts">
          <Card hover className="h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Alert rules settings
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/services">
          <Card hover className="h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Services</p>
                <p className="text-sm text-muted-foreground">
                  Manage all services
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/containers">
          <Card hover className="h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
                <Box className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Containers</p>
                <p className="text-sm text-muted-foreground">
                  Docker container status
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/ports">
          <Card hover className="h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
                <Network className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Ports</p>
                <p className="text-sm text-muted-foreground">
                  Port registry management
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/system">
          <Card hover className="h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">System</p>
                <p className="text-sm text-muted-foreground">
                  Resource monitoring
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </nav>
    </section>
  );
});

QuickLinksSection.displayName = 'QuickLinksSection';

/**
 * 위젯 컴포넌트 매핑
 * ReactNode 대신 컴포넌트를 저장하여 불필요한 재생성 방지
 */
const WIDGET_COMPONENTS: Record<WidgetId, () => ReactNode> = {
  'system-stats': () => (
    <section aria-label="System Metrics">
      <DashboardStats />
    </section>
  ),
  'metrics-charts': () => (
    <section aria-label="System Metrics Charts">
      <LazyMetricsCharts />
    </section>
  ),
  containers: () => <ContainerStats />,
  services: () => <RunningServicesCard />,
  overview: () => (
    <section aria-label="Admin Overview">
      <AdminOverview />
    </section>
  ),
  'quick-links': () => <QuickLinksSection />,
  'url-reference': () => (
    <section aria-label="URL Quick Reference">
      <UrlQuickReference />
    </section>
  ),
};

/**
 * 위젯 래퍼 컴포넌트
 *
 * Containers와 Services 위젯은 2열 그리드로 묶어서 표시합니다.
 */
function renderWidgets(visibleWidgetIds: WidgetId[]): ReactNode[] {
  const result: ReactNode[] = [];
  let i = 0;

  while (i < visibleWidgetIds.length) {
    const currentId = visibleWidgetIds[i];

    // containers와 services가 연속으로 있으면 2열 그리드로 묶기
    if (currentId === 'containers' && visibleWidgetIds[i + 1] === 'services') {
      result.push(
        <section
          key="containers-services"
          aria-label="Containers and Services"
          className="grid gap-6 lg:grid-cols-2"
        >
          <ContainerStats />
          <RunningServicesCard />
        </section>
      );
      i += 2;
    } else if (currentId === 'services' && visibleWidgetIds[i + 1] === 'containers') {
      result.push(
        <section
          key="services-containers"
          aria-label="Services and Containers"
          className="grid gap-6 lg:grid-cols-2"
        >
          <RunningServicesCard />
          <ContainerStats />
        </section>
      );
      i += 2;
    } else if (currentId === 'containers') {
      // containers만 있는 경우
      result.push(
        <section key="containers-only" aria-label="Containers">
          <ContainerStats />
        </section>
      );
      i += 1;
    } else if (currentId === 'services') {
      // services만 있는 경우
      result.push(
        <section key="services-only" aria-label="Running Services">
          <RunningServicesCard />
        </section>
      );
      i += 1;
    } else {
      // 일반 위젯
      const WidgetComponent = WIDGET_COMPONENTS[currentId];
      result.push(<div key={currentId}>{WidgetComponent()}</div>);
      i += 1;
    }
  }

  return result;
}

/**
 * AdminDashboard 메인 컴포넌트
 */
export function AdminDashboard() {
  const { settings, isLoading: isSettingsLoading } = useSettings();
  const { layout, setLayout, getVisibleWidgets, isInitialized } =
    useDashboardStore();

  // 서버 설정에서 레이아웃 로드
  useEffect(() => {
    if (!isSettingsLoading && settings && !isInitialized) {
      const serverLayout = parseDashboardLayout(settings.dashboardLayout);
      setLayout(serverLayout);
    } else if (!isSettingsLoading && !settings && !isInitialized) {
      // 설정이 없으면 (비로그인 등) 기본 레이아웃으로 초기화
      setLayout(useDashboardStore.getState().layout);
    }
  }, [isSettingsLoading, settings, isInitialized, setLayout]);

  // 표시할 위젯 목록 - useMemo로 캐싱하여 불필요한 재계산 방지
  const visibleWidgetIds = useMemo(() => {
    const visibleWidgets = getVisibleWidgets();
    return visibleWidgets.map((w) => w.id);
  }, [getVisibleWidgets]);

  // 렌더링할 위젯 목록 - useMemo로 캐싱
  const renderedWidgets = useMemo(
    () => renderWidgets(visibleWidgetIds),
    [visibleWidgetIds]
  );

  // 로딩 상태
  if (isSettingsLoading && !isInitialized) {
    return (
      <div className="space-y-8" aria-live="polite" aria-busy="true">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">시스템 상태 및 서비스 개요</p>
          </div>
        </header>
        <div className="flex items-center justify-center py-12" role="status">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-hidden="true" />
          <span className="sr-only">대시보드 로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">시스템 상태 및 서비스 개요</p>
        </div>
        <div className="flex items-center gap-3">
          <WidgetCustomizer />
          <RoleBanner />
        </div>
      </header>

      {/* 동적 위젯 렌더링 */}
      {renderedWidgets}
    </div>
  );
}

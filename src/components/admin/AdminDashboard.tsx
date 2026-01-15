'use client';

/**
 * AdminDashboard 컴포넌트
 *
 * Phase 20: User Dashboard Settings
 *
 * 사용자 설정에 따라 위젯을 동적으로 렌더링하는 대시보드입니다.
 * WidgetCustomizer와 연동하여 위젯 순서와 가시성을 조절합니다.
 */

import { useEffect, type ReactNode } from 'react';
import {
  Activity,
  Bell,
  Box,
  ExternalLink,
  FolderKanban,
  Layers,
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
import { useDashboardStore, parseDashboardLayout } from '@/stores/dashboardStore';
import { useSettings } from '@/hooks/useSettings';
import type { WidgetId } from '@/types/dashboard';

/**
 * Running Services 카드 컴포넌트
 */
function RunningServicesCard() {
  const runningServices = getRunningServices();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
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
                <div className="flex items-center gap-2">
                  {service.url && (
                    <Button asChild variant="ghost" size="sm">
                      <a
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">Open {service.name}</span>
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
}

/**
 * Quick Links 섹션 컴포넌트
 */
function QuickLinksSection() {
  return (
    <section aria-label="Quick Access">
      <h2 className="mb-4 text-lg font-semibold">Quick Access</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/projects">
          <Card hover className="h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
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

        <Link href="/admin/system" className="sm:col-span-2 lg:col-span-1">
          <Card hover className="h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
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
      </div>
    </section>
  );
}

/**
 * 위젯 컴포넌트 매핑
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

  // 표시할 위젯 목록
  const visibleWidgets = getVisibleWidgets();
  const visibleWidgetIds = visibleWidgets.map((w) => w.id);

  // 로딩 상태
  if (isSettingsLoading && !isInitialized) {
    return (
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">시스템 상태 및 서비스 개요</p>
          </div>
        </header>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
      {renderWidgets(visibleWidgetIds)}
    </div>
  );
}

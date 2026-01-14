import { Activity, Box, ExternalLink, Layers } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/services/StatusBadge';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { ContainerStats } from '@/components/admin/ContainerStats';
import { getRunningServices } from '@/config/services';

/**
 * 관리자 대시보드 페이지
 * 시스템 상태, 컨테이너, 서비스를 한눈에 파악할 수 있는 허브 페이지
 */

// Running Services 카드 컴포넌트
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

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          시스템 상태 및 서비스 개요
        </p>
      </header>

      {/* Section 1: System Metrics - Primary (4열 그리드) */}
      <section aria-label="System Metrics">
        <DashboardStats />
      </section>

      {/* Section 2: Containers + Running Services - Secondary (2열) */}
      <section
        aria-label="Containers and Services"
        className="grid gap-6 lg:grid-cols-2"
      >
        <ContainerStats />
        <RunningServicesCard />
      </section>

      {/* Section 3: Quick Links - Tertiary (3열) */}
      <section aria-label="Quick Access">
        <h2 className="mb-4 text-lg font-semibold">Quick Access</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}

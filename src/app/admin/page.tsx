import {
  Activity,
  Box,
  Cpu,
  HardDrive,
  Layers,
  MemoryStick,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/services/StatusBadge";
import { services, getRunningServices } from "@/config/services";

export default function AdminDashboardPage() {
  const runningServices = getRunningServices();
  const totalContainers = services.reduce(
    (acc, s) => acc + s.containers.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          시스템 상태 및 서비스 개요
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Services
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-xs text-muted-foreground">
              {runningServices.length} running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Containers
            </CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContainers}</div>
            <p className="text-xs text-muted-foreground">Docker containers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CPU Usage
            </CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Load average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Memory
            </CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Used / Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Running Services */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Running Services</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/services">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {runningServices.length === 0 ? (
            <p className="text-muted-foreground">No services running</p>
          ) : (
            <div className="space-y-3">
              {runningServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={service.status} showLabel={false} />
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {service.port ? `Port ${service.port}` : "No port"}
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
                        >
                          Open
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      Stop
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/services">
          <Card hover className="h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
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
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
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

        <Link href="/admin/system">
          <Card hover className="h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
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
    </div>
  );
}

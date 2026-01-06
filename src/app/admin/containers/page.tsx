"use client";

import { Box, Play, Square, RefreshCw, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { services } from "@/config/services";

export default function AdminContainersPage() {
  const allContainers = services.flatMap((service) =>
    service.containers.map((container) => ({
      name: container,
      service: service.name,
      serviceId: service.id,
      status: service.status,
    }))
  );

  const runningCount = allContainers.filter(
    (c) => c.status === "running"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Containers</h1>
        <p className="mt-1 text-muted-foreground">
          Docker 컨테이너 상태 및 관리
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
          <Box className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            Total: <strong>{allContainers.length}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse-dot" />
          <span className="text-sm">
            Running: <strong>{runningCount}</strong>
          </span>
        </div>
      </div>

      {/* Containers by Service */}
      {services
        .filter((service) => service.containers.length > 0)
        .map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {service.name}
                  <Badge
                    variant={
                      service.status === "running" ? "success" : "secondary"
                    }
                  >
                    {service.status}
                  </Badge>
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  {service.containers.length} containers
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {service.containers.map((container) => (
                  <div
                    key={container}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          service.status === "running"
                            ? "bg-green-500 animate-pulse-dot"
                            : "bg-gray-400"
                        }`}
                      />
                      <span className="font-mono text-sm">{container}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {service.status === "running" ? (
                        <>
                          <Button variant="ghost" size="sm">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Square className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button variant="ghost" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

      {allContainers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Box className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              No containers configured
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

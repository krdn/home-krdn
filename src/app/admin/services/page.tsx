"use client";

import { useState } from "react";
import { ExternalLink, Play, Square, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/services/StatusBadge";
import { TechBadge } from "@/components/services/TechBadge";
import { services } from "@/config/services";
import { CATEGORY_LABELS } from "@/types/service";
import { cn } from "@/lib/utils";

export default function AdminServicesPage() {
  const [filter, setFilter] = useState<"all" | "running" | "stopped">("all");

  const filteredServices = services.filter((service) => {
    if (filter === "running") return service.status === "running";
    if (filter === "stopped") return service.status === "stopped";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Services</h1>
          <p className="mt-1 text-muted-foreground">
            서비스 시작/중지 및 상태 관리
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border p-1">
          {(["all", "running", "stopped"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {filteredServices.map((service) => (
          <Card key={service.id}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Service Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={service.status} />
                    <h3 className="text-lg font-semibold">{service.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[service.category]}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    {service.port && (
                      <span className="text-xs text-muted-foreground">
                        Port: <span className="font-mono">{service.port}</span>
                      </span>
                    )}
                    {service.containers.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        • {service.containers.length} containers
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {service.techStack.slice(0, 4).map((tech) => (
                      <TechBadge key={tech} tech={tech} size="sm" />
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {service.url && (
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </a>
                    </Button>
                  )}

                  {service.status === "running" ? (
                    <>
                      <Button variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Restart
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                      >
                        <Square className="h-4 w-4" />
                        Stop
                      </Button>
                    </>
                  ) : (
                    <Button variant="success" size="sm" className="gap-2">
                      <Play className="h-4 w-4" />
                      Start
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

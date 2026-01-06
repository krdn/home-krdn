"use client";

import { useState } from "react";
import { ScrollText, Download, Trash2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { services } from "@/config/services";
import { cn } from "@/lib/utils";

export default function AdminLogsPage() {
  const [selectedContainer, setSelectedContainer] = useState<string | null>(
    null
  );
  const [autoRefresh, setAutoRefresh] = useState(false);

  const allContainers = services.flatMap((service) =>
    service.containers.map((container) => ({
      name: container,
      service: service.name,
      status: service.status,
    }))
  );

  const sampleLogs = [
    { time: "2024-01-06 19:30:15", level: "INFO", message: "Service started successfully" },
    { time: "2024-01-06 19:30:16", level: "INFO", message: "Connected to database" },
    { time: "2024-01-06 19:30:17", level: "INFO", message: "Listening on port 3000" },
    { time: "2024-01-06 19:31:22", level: "DEBUG", message: "Processing request GET /api/status" },
    { time: "2024-01-06 19:31:23", level: "INFO", message: "Request completed in 45ms" },
    { time: "2024-01-06 19:32:45", level: "WARN", message: "High memory usage detected" },
    { time: "2024-01-06 19:33:01", level: "INFO", message: "Health check passed" },
    { time: "2024-01-06 19:34:15", level: "ERROR", message: "Connection timeout - retrying..." },
    { time: "2024-01-06 19:34:18", level: "INFO", message: "Connection restored" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Logs</h1>
        <p className="mt-1 text-muted-foreground">실시간 컨테이너 로그 조회</p>
      </div>

      {/* Container Select */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Container</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allContainers.map((container) => (
              <button
                key={container.name}
                onClick={() => setSelectedContainer(container.name)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-mono transition-colors",
                  selectedContainer === container.name
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                )}
              >
                <span
                  className={cn(
                    "mr-2 inline-block h-2 w-2 rounded-full",
                    container.status === "running"
                      ? "bg-green-500"
                      : "bg-gray-400"
                  )}
                />
                {container.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Log Options */}
      {selectedContainer && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Lines:</label>
            <select className="rounded-md border bg-background px-2 py-1 text-sm">
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="500">500</option>
            </select>
          </div>

          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <RefreshCw
              className={cn("h-4 w-4", autoRefresh && "animate-spin")}
            />
            Auto-refresh: {autoRefresh ? "ON" : "OFF"}
          </Button>

          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>

          <Button variant="outline" size="sm" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      )}

      {/* Log Output */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            {selectedContainer || "Select a container"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedContainer ? (
            <div className="max-h-[500px] overflow-auto rounded-lg bg-black p-4 font-mono text-sm">
              {sampleLogs.map((log, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-gray-500">{log.time}</span>
                  <span
                    className={cn(
                      "min-w-[50px]",
                      log.level === "INFO" && "text-blue-400",
                      log.level === "DEBUG" && "text-gray-400",
                      log.level === "WARN" && "text-yellow-400",
                      log.level === "ERROR" && "text-red-400"
                    )}
                  >
                    [{log.level}]
                  </span>
                  <span className="text-gray-200">{log.message}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <ScrollText className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-4">Select a container to view logs</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

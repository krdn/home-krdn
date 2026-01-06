"use client";

import { cn } from "@/lib/utils";
import type { ServiceStatus } from "@/types/service";

interface StatusBadgeProps {
  status: ServiceStatus;
  pulse?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const statusConfig: Record<
  ServiceStatus,
  { color: string; bg: string; label: string }
> = {
  running: {
    color: "bg-green-500",
    bg: "bg-green-500/20",
    label: "Running",
  },
  stopped: {
    color: "bg-gray-400",
    bg: "bg-gray-400/20",
    label: "Stopped",
  },
  starting: {
    color: "bg-yellow-500",
    bg: "bg-yellow-500/20",
    label: "Starting",
  },
  error: {
    color: "bg-red-500",
    bg: "bg-red-500/20",
    label: "Error",
  },
  unknown: {
    color: "bg-gray-400",
    bg: "bg-gray-400/20",
    label: "Unknown",
  },
};

export function StatusBadge({
  status,
  pulse = true,
  showLabel = true,
  size = "md",
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5",
        config.bg,
        size === "sm" && "px-1.5 py-0.5"
      )}
    >
      <span
        className={cn(
          "rounded-full",
          config.color,
          size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2",
          pulse && status === "running" && "animate-pulse-dot"
        )}
      />
      {showLabel && (
        <span
          className={cn(
            "font-medium",
            size === "sm" ? "text-xs" : "text-sm",
            status === "running" && "text-green-500",
            status === "stopped" && "text-gray-400",
            status === "starting" && "text-yellow-500",
            status === "error" && "text-red-500"
          )}
        >
          {config.label}
        </span>
      )}
    </div>
  );
}

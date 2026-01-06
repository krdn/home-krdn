export interface SystemMetrics {
  cpu: CpuMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  uptime: number;
  timestamp: string;
}

export interface CpuMetrics {
  usage: number;
  cores: number;
}

export interface MemoryMetrics {
  total: number;
  used: number;
  free: number;
  percentage: number;
}

export interface DiskMetrics {
  total: number;
  used: number;
  free: number;
  percentage: number;
}

export interface HealthStatus {
  status: "ok" | "degraded" | "error";
  services: {
    docker: boolean;
    system: boolean;
  };
  timestamp: string;
}

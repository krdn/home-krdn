export type ServiceStatus = "running" | "stopped" | "starting" | "error" | "unknown";

export type ServiceCategory = "ai" | "n8n" | "infrastructure";

export interface Service {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  category: ServiceCategory;
  status: ServiceStatus;
  techStack: string[];
  port?: number;
  path?: string;
  url?: string;
  docsUrl?: string;
  githubUrl?: string;
  features: string[];
  containers: string[];
  screenshot?: string;
  icon?: string;
}

export interface ServiceWithStatus extends Service {
  containerStatuses?: ContainerStatus[];
  metrics?: ServiceMetrics;
}

export interface ContainerStatus {
  id: string;
  name: string;
  image: string;
  status: string;
  state: "running" | "exited" | "paused" | "restarting" | "created";
  ports: PortMapping[];
  created: string;
  health?: "healthy" | "unhealthy" | "starting" | "none";
}

export interface PortMapping {
  private: number;
  public: number | null;
  protocol?: string;
}

export interface ServiceMetrics {
  cpu: number;
  memory: number;
  memoryLimit: number;
}

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  ai: "AI Projects",
  n8n: "n8n & Automation",
  infrastructure: "Infrastructure",
};

export const CATEGORY_ICONS: Record<ServiceCategory, string> = {
  ai: "Brain",
  n8n: "Workflow",
  infrastructure: "Server",
};

export const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  ai: "from-purple-500 to-pink-500",
  n8n: "from-orange-500 to-amber-500",
  infrastructure: "from-blue-500 to-cyan-500",
};

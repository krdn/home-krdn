/**
 * DevOps Dashboard 타입 정의
 *
 * Phase 42: DevOps Home
 * - 각 DevOps 도구 상태 요약
 * - 대시보드 표시용 데이터 구조
 */

import { z } from 'zod';

/**
 * GitHub 상태 요약
 */
export const GitHubSummarySchema = z.object({
  connected: z.boolean(),
  username: z.string().optional(),
  repoCount: z.number().optional(),
  recentRuns: z.array(z.object({
    id: z.number(),
    name: z.string(),
    repo: z.string(),
    status: z.string(),
    conclusion: z.string().nullable(),
    createdAt: z.string(),
  })).optional(),
});

export type GitHubSummary = z.infer<typeof GitHubSummarySchema>;

/**
 * Kubernetes 상태 요약
 */
export const KubernetesSummarySchema = z.object({
  clusterCount: z.number(),
  activeClusterCount: z.number(),
  clusters: z.array(z.object({
    id: z.string(),
    name: z.string(),
    isActive: z.boolean(),
    podCount: z.number().optional(),
    serviceCount: z.number().optional(),
    deploymentCount: z.number().optional(),
  })).optional(),
});

export type KubernetesSummary = z.infer<typeof KubernetesSummarySchema>;

/**
 * Port Registry 상태 요약
 */
export const PortsSummarySchema = z.object({
  totalPorts: z.number(),
  activePorts: z.number(),
  recentPorts: z.array(z.object({
    id: z.string(),
    port: z.number(),
    projectName: z.string(),
    environment: z.string(),
  })).optional(),
});

export type PortsSummary = z.infer<typeof PortsSummarySchema>;

/**
 * Log Alerts 상태 요약
 */
export const LogAlertsSummarySchema = z.object({
  totalRules: z.number(),
  activeRules: z.number(),
  recentTriggers: z.number(),
});

export type LogAlertsSummary = z.infer<typeof LogAlertsSummarySchema>;

/**
 * 전체 DevOps 상태 요약
 */
export const DevOpsSummarySchema = z.object({
  github: GitHubSummarySchema,
  kubernetes: KubernetesSummarySchema,
  ports: PortsSummarySchema,
  logAlerts: LogAlertsSummarySchema,
  generatedAt: z.string(),
});

export type DevOpsSummary = z.infer<typeof DevOpsSummarySchema>;

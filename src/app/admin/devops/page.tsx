/**
 * Admin DevOps 페이지
 *
 * DevOps 도구 통합 대시보드 홈
 * GitHub, Kubernetes, Ports, Log Alerts 상태 요약 표시
 *
 * Phase 42: DevOps Home
 */

import { Metadata } from 'next';
import { DevOpsHome } from '@/components/devops';

export const metadata: Metadata = {
  title: 'DevOps Dashboard - Admin',
  description: 'DevOps 도구 상태 대시보드',
};

export default function DevOpsPage() {
  return <DevOpsHome />;
}

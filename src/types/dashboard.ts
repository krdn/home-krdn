/**
 * 대시보드 위젯 타입 정의
 *
 * Phase 20: User Dashboard Settings
 *
 * 사용자가 대시보드 위젯의 가시성과 순서를 개인화할 수 있습니다.
 */

/**
 * 위젯 ID 타입
 *
 * 대시보드에서 사용 가능한 위젯들의 식별자입니다.
 */
export type WidgetId =
  | 'system-stats' // DashboardStats (CPU/Memory/Disk/Uptime)
  | 'metrics-charts' // LazyMetricsCharts
  | 'containers' // ContainerStats
  | 'services' // RunningServicesCard
  | 'overview' // AdminOverview
  | 'quick-links' // Quick Access
  | 'url-reference'; // URL Quick Reference

/**
 * 위젯 설정
 *
 * 각 위젯의 가시성과 순서를 정의합니다.
 */
export interface WidgetConfig {
  /** 위젯 식별자 */
  id: WidgetId;
  /** 표시 여부 */
  visible: boolean;
  /** 표시 순서 (낮을수록 먼저 표시) */
  order: number;
}

/**
 * 대시보드 레이아웃
 *
 * 사용자의 대시보드 위젯 배치 설정입니다.
 */
export interface DashboardLayout {
  /** 위젯 설정 목록 */
  widgets: WidgetConfig[];
}

/**
 * 위젯 메타데이터
 *
 * UI에서 표시할 위젯 정보입니다.
 */
export interface WidgetMeta {
  /** 위젯 식별자 */
  id: WidgetId;
  /** 표시 이름 */
  name: string;
  /** 설명 */
  description: string;
}

/**
 * 위젯 메타데이터 목록
 *
 * 커스터마이저 UI에서 사용됩니다.
 */
export const WIDGET_META: Record<WidgetId, WidgetMeta> = {
  'system-stats': {
    id: 'system-stats',
    name: 'System Stats',
    description: 'CPU, Memory, Disk, Uptime 정보',
  },
  'metrics-charts': {
    id: 'metrics-charts',
    name: 'Metrics Charts',
    description: '시스템 메트릭 차트',
  },
  containers: {
    id: 'containers',
    name: 'Containers',
    description: 'Docker 컨테이너 상태',
  },
  services: {
    id: 'services',
    name: 'Running Services',
    description: '실행 중인 서비스 목록',
  },
  overview: {
    id: 'overview',
    name: 'Admin Overview',
    description: '관리자 개요 정보',
  },
  'quick-links': {
    id: 'quick-links',
    name: 'Quick Links',
    description: '빠른 접근 링크',
  },
  'url-reference': {
    id: 'url-reference',
    name: 'URL Quick Reference',
    description: '서비스 URL 빠른 참조',
  },
};

/**
 * 기본 대시보드 레이아웃
 *
 * 새 사용자 또는 리셋 시 사용됩니다.
 */
export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  widgets: [
    { id: 'system-stats', visible: true, order: 0 },
    { id: 'metrics-charts', visible: true, order: 1 },
    { id: 'containers', visible: true, order: 2 },
    { id: 'services', visible: true, order: 3 },
    { id: 'url-reference', visible: true, order: 4 },
    { id: 'overview', visible: true, order: 5 },
    { id: 'quick-links', visible: true, order: 6 },
  ],
};

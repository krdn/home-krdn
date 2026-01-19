/**
 * 도움말 시스템 타입 정의
 * HelpButton/HelpModal 컴포넌트가 사용하는 타입들을 정의합니다.
 *
 * Phase 44: Help Infrastructure
 */

// 페이지 도움말 ID
export type PageHelpId =
  // Public 페이지
  | 'page-home'
  | 'page-services'
  | 'page-projects'
  | 'page-ports'
  | 'page-teams'
  // Admin 페이지
  | 'page-dashboard'
  | 'page-containers'
  | 'page-settings'
  | 'page-admin'
  | 'page-alerts'
  | 'page-logs'
  // Admin 페이지 상세 (Phase 45)
  | 'page-admin-dashboard'
  | 'page-admin-github'
  | 'page-admin-logs'
  | 'page-admin-log-alerts'
  | 'page-admin-kubernetes'
  | 'page-admin-devops'
  | 'page-admin-ports';

// 위젯 도움말 ID
export type WidgetHelpId =
  // Dashboard 위젯
  | 'widget-system-monitor'
  | 'widget-container-stats'
  | 'widget-network-chart'
  | 'widget-process-chart'
  | 'widget-disk-usage'
  | 'widget-alert-summary'
  | 'widget-service-status'
  | 'widget-log-viewer'
  | 'widget-quick-actions'
  // Port 위젯 (Phase 43)
  | 'widget-port-scanner'
  | 'widget-port-comparison'
  | 'widget-port-guide'
  // Admin/DevOps 위젯 (Phase 46-02)
  | 'widget-alert-rules'
  | 'widget-email-settings'
  | 'widget-slack-settings'
  | 'widget-log-filter'
  | 'widget-workflow-list'
  | 'widget-k8s-pods'
  | 'widget-k8s-services'
  | 'widget-k8s-deployments'
  | 'widget-service-topology'
  // Team/Project/Service 위젯 (Phase 46-02)
  | 'widget-team-members'
  | 'widget-team-settings'
  | 'widget-project-card'
  | 'widget-service-card'
  // Legacy (deprecated - widget-network-status → widget-network-chart)
  | 'widget-network-status';

// 일반 도움말 ID
export type GeneralHelpId =
  | 'general-navigation'
  | 'general-settings'
  | 'general-keyboard-shortcuts'
  | 'general-not-found';

// 모든 도움말 ID의 통합 타입
export type HelpId = PageHelpId | WidgetHelpId | GeneralHelpId;

// 관련 링크 타입
export interface HelpLink {
  label: string;
  href: string;
}

// 도움말 콘텐츠 인터페이스
export interface HelpContent {
  /** 도움말 고유 ID */
  id: HelpId;
  /** 도움말 제목 */
  title: string;
  /** 도움말 내용 (마크다운 또는 plain text) */
  content: string;
  /** 관련 링크 (선택) */
  relatedLinks?: HelpLink[];
}

// useHelp 훅 상태 인터페이스
export interface HelpState {
  /** 도움말 모달 열림 상태 */
  isOpen: boolean;
  /** 현재 표시 중인 도움말 ID */
  currentHelpId: HelpId | null;
}

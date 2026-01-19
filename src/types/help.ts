/**
 * 도움말 시스템 타입 정의
 * HelpButton/HelpModal 컴포넌트가 사용하는 타입들을 정의합니다.
 *
 * Phase 44: Help Infrastructure
 */

// 페이지 도움말 ID
export type PageHelpId =
  | 'page-dashboard'
  | 'page-services'
  | 'page-projects'
  | 'page-containers'
  | 'page-settings'
  | 'page-admin'
  | 'page-alerts'
  | 'page-logs';

// 위젯 도움말 ID
export type WidgetHelpId =
  | 'widget-system-monitor'
  | 'widget-container-stats'
  | 'widget-network-status'
  | 'widget-disk-usage'
  | 'widget-alert-summary'
  | 'widget-service-status'
  | 'widget-log-viewer'
  | 'widget-quick-actions';

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

/**
 * 도움말 콘텐츠 저장소
 * 모든 도움말 콘텐츠를 관리하고 조회 함수를 제공합니다.
 *
 * Phase 44: Help Infrastructure
 */

import type { HelpContent, HelpId } from '@/types/help';

/**
 * 기본 도움말 콘텐츠 (존재하지 않는 ID 요청 시 반환)
 */
export const DEFAULT_HELP_CONTENT: HelpContent = {
  id: 'general-not-found',
  title: '도움말을 찾을 수 없습니다',
  content: '요청하신 도움말을 찾을 수 없습니다. 다른 도움말을 참조하거나 관리자에게 문의해 주세요.',
  relatedLinks: [
    { label: '대시보드 도움말', href: '#page-dashboard' },
    { label: '설정 도움말', href: '#general-settings' },
  ],
};

/**
 * 도움말 콘텐츠 저장소
 * Phase 45-46에서 페이지/위젯별 콘텐츠가 추가됩니다.
 */
export const helpContents: Record<HelpId, HelpContent> = {
  // === 페이지 도움말 ===
  'page-dashboard': {
    id: 'page-dashboard',
    title: '대시보드',
    content: `대시보드는 시스템의 전체 상태를 한눈에 보여주는 메인 페이지입니다.

**주요 기능:**
- 시스템 리소스 모니터링 (CPU, 메모리, 디스크)
- 컨테이너 상태 요약
- 최근 알림 확인
- 서비스 상태 개요

**팁:** 각 위젯의 (?) 버튼을 클릭하면 해당 위젯의 상세 도움말을 볼 수 있습니다.`,
    relatedLinks: [
      { label: '서비스 관리', href: '/services' },
      { label: '설정', href: '/settings' },
    ],
  },

  'page-services': {
    id: 'page-services',
    title: '서비스 관리',
    content: '등록된 서비스들의 상태를 확인하고 관리합니다. (Phase 45에서 상세 내용 추가)',
  },

  'page-projects': {
    id: 'page-projects',
    title: '프로젝트 관리',
    content: '프로젝트 목록과 상태를 관리합니다. (Phase 45에서 상세 내용 추가)',
  },

  'page-containers': {
    id: 'page-containers',
    title: '컨테이너 관리',
    content: 'Docker 컨테이너의 상태를 확인하고 제어합니다. (Phase 45에서 상세 내용 추가)',
  },

  'page-settings': {
    id: 'page-settings',
    title: '설정',
    content: '애플리케이션 설정을 관리합니다. (Phase 45에서 상세 내용 추가)',
  },

  'page-admin': {
    id: 'page-admin',
    title: '관리자 페이지',
    content: '관리자 전용 기능을 제공합니다. (Phase 45에서 상세 내용 추가)',
  },

  'page-alerts': {
    id: 'page-alerts',
    title: '알림 관리',
    content: '알림 규칙과 히스토리를 관리합니다. (Phase 45에서 상세 내용 추가)',
  },

  'page-logs': {
    id: 'page-logs',
    title: '로그 뷰어',
    content: '시스템 및 컨테이너 로그를 조회합니다. (Phase 45에서 상세 내용 추가)',
  },

  // === 위젯 도움말 ===
  'widget-system-monitor': {
    id: 'widget-system-monitor',
    title: '시스템 모니터',
    content: 'CPU, 메모리, 디스크 사용량을 실시간으로 표시합니다. (Phase 46에서 상세 내용 추가)',
  },

  'widget-container-stats': {
    id: 'widget-container-stats',
    title: '컨테이너 통계',
    content: '컨테이너 실행 상태와 리소스 사용량을 표시합니다. (Phase 46에서 상세 내용 추가)',
  },

  'widget-network-status': {
    id: 'widget-network-status',
    title: '네트워크 상태',
    content: '네트워크 연결 상태와 트래픽을 모니터링합니다. (Phase 46에서 상세 내용 추가)',
  },

  'widget-disk-usage': {
    id: 'widget-disk-usage',
    title: '디스크 사용량',
    content: '디스크 파티션별 사용량과 I/O를 표시합니다. (Phase 46에서 상세 내용 추가)',
  },

  'widget-alert-summary': {
    id: 'widget-alert-summary',
    title: '알림 요약',
    content: '최근 발생한 알림을 요약해서 표시합니다. (Phase 46에서 상세 내용 추가)',
  },

  'widget-service-status': {
    id: 'widget-service-status',
    title: '서비스 상태',
    content: '등록된 서비스들의 상태를 한눈에 표시합니다. (Phase 46에서 상세 내용 추가)',
  },

  'widget-log-viewer': {
    id: 'widget-log-viewer',
    title: '로그 뷰어',
    content: '최근 로그 메시지를 실시간으로 표시합니다. (Phase 46에서 상세 내용 추가)',
  },

  'widget-quick-actions': {
    id: 'widget-quick-actions',
    title: '빠른 작업',
    content: '자주 사용하는 작업을 빠르게 실행할 수 있습니다. (Phase 46에서 상세 내용 추가)',
  },

  // === 일반 도움말 ===
  'general-navigation': {
    id: 'general-navigation',
    title: '네비게이션 가이드',
    content: `사이드바와 헤더를 사용하여 페이지 간 이동할 수 있습니다.

**사이드바:**
- 대시보드, 서비스, 프로젝트 등 주요 페이지 접근
- 하단에 설정 및 도움말 링크

**헤더:**
- 사용자 프로필 및 로그아웃
- 알림 센터 접근`,
    relatedLinks: [
      { label: '키보드 단축키', href: '#general-keyboard-shortcuts' },
    ],
  },

  'general-settings': {
    id: 'general-settings',
    title: '설정 가이드',
    content: '설정 페이지에서 애플리케이션의 다양한 옵션을 변경할 수 있습니다.',
  },

  'general-keyboard-shortcuts': {
    id: 'general-keyboard-shortcuts',
    title: '키보드 단축키',
    content: `**전역 단축키:**
- \`Ctrl+K\` / \`Cmd+K\`: 빠른 검색
- \`Esc\`: 모달 닫기
- \`?\`: 도움말 열기

**대시보드:**
- \`R\`: 새로고침`,
  },

  'general-not-found': DEFAULT_HELP_CONTENT,
};

/**
 * 도움말 콘텐츠 조회 함수
 *
 * @param helpId - 조회할 도움말 ID
 * @returns 해당 도움말 콘텐츠 (없으면 기본 콘텐츠 반환)
 *
 * @example
 * ```ts
 * const content = getHelpContent('page-dashboard');
 * console.log(content.title); // '대시보드'
 *
 * const notFound = getHelpContent('invalid-id' as HelpId);
 * console.log(notFound.title); // '도움말을 찾을 수 없습니다'
 * ```
 */
export function getHelpContent(helpId: string): HelpContent {
  // 유효한 HelpId인지 확인
  if (helpId in helpContents) {
    return helpContents[helpId as HelpId];
  }
  return DEFAULT_HELP_CONTENT;
}

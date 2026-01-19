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
 * Phase 45: 페이지별 도움말 콘텐츠
 * Phase 46: 위젯별 도움말 콘텐츠 추가 예정
 */
export const helpContents: Record<HelpId, HelpContent> = {
  // === Public 페이지 도움말 ===
  'page-home': {
    id: 'page-home',
    title: '홈',
    content: `홈서버 모니터링 허브의 메인 페이지입니다.

**주요 기능:**
- 서비스 카테고리별 분류 (AI, n8n, Infrastructure)
- 주요 서비스 소개 및 바로가기
- 실행 중인 서비스 수 실시간 표시

💡 **팁:** 로그인하면 Admin 패널에서 더 많은 기능을 사용할 수 있습니다.`,
    relatedLinks: [
      { label: '서비스 카탈로그', href: '/services' },
      { label: '프로젝트 갤러리', href: '/projects' },
    ],
  },

  'page-services': {
    id: 'page-services',
    title: '서비스 카탈로그',
    content: `등록된 모든 서비스를 조회하고 상태를 확인합니다.

**주요 기능:**
- 카테고리 필터 (All, AI, n8n, Infra)
- 서비스 검색
- 실행 중인 서비스만 필터링 (Running only)
- 서비스 상세 정보 확인

**상태 색상:**
- 🟢 녹색: 실행 중 (running)
- 🔴 빨간색: 중지됨 (stopped)

💡 **팁:** Admin > Services에서 서비스 등록/수정/삭제가 가능합니다.`,
    relatedLinks: [
      { label: '서비스 관리 (Admin)', href: '/admin/services' },
    ],
  },

  'page-projects': {
    id: 'page-projects',
    title: '프로젝트 갤러리',
    content: `등록된 프로젝트 목록과 상세 정보를 확인합니다.

**주요 기능:**
- 프로젝트 검색
- Featured 프로젝트 필터
- 카테고리별 필터 (Web, API, AI, Data, Infra, Tool)

**상태:**
- active: 활성 (현재 개발/운영 중)
- archived: 보관됨
- planned: 계획 중

💡 **팁:** Admin > Projects에서 프로젝트 등록/수정이 가능합니다.`,
    relatedLinks: [
      { label: '프로젝트 관리 (Admin)', href: '/admin/projects' },
    ],
  },

  'page-ports': {
    id: 'page-ports',
    title: '포트 레지스트리',
    content: `개발 서버 포트 할당 현황을 조회합니다.

**주요 기능:**
- 포트 목록 조회 (서비스/프로젝트별)
- 카테고리별 필터
- 빠른 포트 예약 요청

**포트 범위 안내:**
- 3000-3999: 웹 개발 (Next.js, React 등)
- 4000-4999: API 서버 (FastAPI, Express 등)
- 5000-5999: 데이터 서비스 (DB, Redis 등)

💡 **팁:** Admin > Ports에서 포트 스캐너, 비교, 가이드 등 상세 관리가 가능합니다.`,
    relatedLinks: [
      { label: '포트 관리 (Admin)', href: '/admin/ports' },
    ],
  },

  'page-teams': {
    id: 'page-teams',
    title: '팀 관리',
    content: `팀을 생성하고 멤버들과 협업합니다.

**주요 기능:**
- 팀 생성 및 설정
- 멤버 초대 (초대 링크)
- 팀별 프로젝트 공유

**역할:**
- owner: 소유자 (팀 삭제, 모든 권한)
- admin: 관리자 (멤버 관리, 설정 변경)
- member: 멤버 (프로젝트 접근)

💡 **팁:** 팀 초대 링크를 공유하여 멤버를 쉽게 추가할 수 있습니다.`,
    relatedLinks: [
      { label: '새 팀 만들기', href: '/teams/new' },
    ],
  },

  // === Admin 페이지 도움말 ===
  'page-dashboard': {
    id: 'page-dashboard',
    title: '대시보드',
    content: `대시보드는 시스템의 전체 상태를 한눈에 보여주는 메인 페이지입니다.

**주요 기능:**
- 시스템 리소스 모니터링 (CPU, 메모리, 디스크)
- 컨테이너 상태 요약
- 최근 알림 확인
- 서비스 상태 개요

💡 **팁:** 각 위젯의 (?) 버튼을 클릭하면 해당 위젯의 상세 도움말을 볼 수 있습니다.`,
    relatedLinks: [
      { label: '서비스 관리', href: '/services' },
      { label: '설정', href: '/settings' },
    ],
  },

  'page-containers': {
    id: 'page-containers',
    title: '컨테이너 관리',
    content: `Docker 컨테이너 상태 모니터링 및 제어

**목적:** Docker 컨테이너의 실시간 상태를 확인하고 제어합니다.

**주요 기능:**
- 컨테이너 목록 및 상태 (running/stopped/restarting)
- 시작/중지/재시작 제어
- 자동 갱신 (10초마다)

**상태 색상:**
- 🟢 녹색: 실행 중
- 🔴 빨간색: 중지됨
- 🟡 노란색: 재시작 중

💡 **팁:** 컨테이너 이름 클릭으로 상세 정보 확인`,
    relatedLinks: [
      { label: 'Admin 대시보드', href: '/admin' },
    ],
  },

  'page-settings': {
    id: 'page-settings',
    title: '설정',
    content: `대시보드 개인 설정 관리

**목적:** 사용자 개인 설정을 관리합니다.

**주요 기능:**
- 테마 설정 (다크/라이트 모드)
- 이메일 알림 ON/OFF
- 푸시 알림 ON/OFF

**동기화:** 설정은 서버에 저장되어 다른 기기에서도 동일하게 적용됩니다.

💡 **팁:** 로그인 상태에서만 설정 변경 가능`,
    relatedLinks: [
      { label: '알림 설정', href: '/admin/alerts' },
    ],
  },

  'page-admin': {
    id: 'page-admin',
    title: '관리자 페이지',
    content: `관리자 전용 기능 허브

**목적:** 시스템 관리 및 DevOps 기능에 접근합니다.

**접근 가능 메뉴:**
- 컨테이너 관리
- 알림 설정
- GitHub 연동
- 로그 뷰어
- Kubernetes 관리
- 포트 관리

⚠️ **주의:** Admin 역할이 필요합니다.`,
    relatedLinks: [
      { label: 'Admin 대시보드', href: '/admin' },
    ],
  },

  'page-alerts': {
    id: 'page-alerts',
    title: '알림 설정',
    content: `시스템 알림 규칙 관리 및 히스토리 확인

**목적:** 알림 규칙을 설정하고 알림 히스토리를 확인합니다.

**주요 기능:**
- 알림 규칙 생성/수정/삭제
- 알림 히스토리 조회
- 채널 설정 (이메일, Slack)

**알림 타입:**
- threshold: 임계값 기반 알림
- pattern: 패턴 매칭 알림
- comparison: 비교 기반 알림

**채널:**
- 이메일 (Resend)
- Slack (Block Kit)
- 푸시 알림

💡 **팁:** 이메일/Slack 설정은 하단 채널 카드에서`,
    relatedLinks: [
      { label: '로그 알림', href: '/admin/log-alerts' },
    ],
  },

  'page-logs': {
    id: 'page-logs',
    title: '로그 뷰어',
    content: `시스템 및 컨테이너 로그 실시간 조회

**목적:** 시스템 로그를 실시간으로 조회하고 검색합니다.

**주요 기능:**
- 로그 검색 (키워드)
- 소스/레벨 필터
- 실시간 스트리밍 모드

**로그 레벨:**
- debug: 디버그 정보
- info: 일반 정보
- warn: 경고
- error: 오류

**소스:**
- docker: 컨테이너 로그
- file: 파일 로그
- app: 애플리케이션 로그

💡 **팁:** 실시간 모드 ON으로 새 로그 자동 수신`,
    relatedLinks: [
      { label: '로그 알림', href: '/admin/log-alerts' },
    ],
  },

  // === Admin 페이지 상세 도움말 (Phase 45-02) ===
  'page-admin-dashboard': {
    id: 'page-admin-dashboard',
    title: 'Admin 대시보드',
    content: `시스템 전체 상태를 한눈에 파악하는 관리자 허브

**목적:** 시스템의 핵심 지표와 서비스 상태를 종합적으로 모니터링합니다.

**주요 기능:**
- 시스템 메트릭 (CPU, 메모리, 디스크)
- 컨테이너 상태 요약
- 실행 중인 서비스 목록
- 위젯 커스터마이징 (표시/숨김, 순서 변경)

💡 **팁:** 각 위젯의 (?) 버튼으로 위젯별 상세 도움말 확인`,
    relatedLinks: [
      { label: '컨테이너 관리', href: '/admin/containers' },
      { label: '설정', href: '/admin/settings' },
    ],
  },

  'page-admin-github': {
    id: 'page-admin-github',
    title: 'GitHub 연동',
    content: `GitHub 레포지토리 및 CI/CD 워크플로우 관리

**목적:** GitHub 레포지토리와 연동하여 CI/CD 워크플로우를 관리합니다.

**주요 기능:**
- Personal Access Token 등록
- 레포지토리 목록 조회
- 워크플로우 실행 기록

**설정 방법:**
Personal Access Token (classic) 필요
- 필수 권한: repo, workflow

**워크플로우 상태:**
- ✅ success: 성공
- ❌ failure: 실패
- 🔄 in_progress: 진행 중

💡 **팁:** 워크플로우 클릭으로 해당 워크플로우만 필터링`,
    relatedLinks: [
      { label: 'GitHub 토큰 생성', href: 'https://github.com/settings/tokens' },
    ],
  },

  'page-admin-logs': {
    id: 'page-admin-logs',
    title: '로그 뷰어',
    content: `시스템 및 컨테이너 로그 실시간 조회

**목적:** 다양한 소스의 로그를 실시간으로 조회하고 검색합니다.

**주요 기능:**
- 로그 검색 (키워드 검색)
- 소스/레벨 필터링
- 실시간 스트리밍 모드
- 로그 통계 시각화

**로그 레벨:**
- debug: 상세 디버그 정보
- info: 일반 정보 메시지
- warn: 경고 메시지
- error: 오류 메시지

**소스 타입:**
- docker: 컨테이너 로그
- file: 파일 기반 로그
- app: 애플리케이션 로그

💡 **팁:** 실시간 모드 ON으로 새 로그 자동 수신`,
    relatedLinks: [
      { label: '로그 알림', href: '/admin/log-alerts' },
    ],
  },

  'page-admin-log-alerts': {
    id: 'page-admin-log-alerts',
    title: '로그 알림',
    content: `로그 패턴 기반 알림 규칙 관리

**목적:** 특정 로그 패턴 발생 시 알림을 받도록 규칙을 설정합니다.

**주요 기능:**
- 키워드/패턴/빈도 규칙 생성
- 규칙 활성화/비활성화
- 트리거 히스토리 조회

**규칙 타입:**
- **keyword:** 특정 키워드 포함 시 알림
- **pattern:** 정규식 패턴 매칭 시 알림
- **frequency:** 시간 윈도우 내 N회 발생 시 알림

💡 **팁:** "error" 키워드 규칙으로 에러 로그 즉시 알림 가능`,
    relatedLinks: [
      { label: '로그 뷰어', href: '/admin/logs' },
    ],
  },

  'page-admin-kubernetes': {
    id: 'page-admin-kubernetes',
    title: 'Kubernetes 관리',
    content: `Kubernetes 클러스터 및 리소스 관리

**목적:** Kubernetes 클러스터를 등록하고 리소스를 관리합니다.

**주요 기능:**
- 클러스터 등록 (kubeconfig 또는 토큰 인증)
- Pod/Service/Deployment 목록 조회
- Service Topology 시각화

**탭 구성:**
- Topology: 서비스 간 연결 맵
- Pods: Pod 목록
- Services: Service 목록
- Deployments: Deployment 목록

**상태 색상:**
- 🟢 Running: 정상 실행
- 🟡 Pending: 대기 중
- 🔴 Failed: 실패

💡 **팁:** Topology 탭에서 서비스 간 연결 관계 시각화`,
  },

  'page-admin-devops': {
    id: 'page-admin-devops',
    title: 'DevOps 대시보드',
    content: `DevOps 도구 통합 상태 요약

**목적:** 모든 DevOps 도구의 상태를 한눈에 파악합니다.

**주요 기능:**
- GitHub/K8s/Ports/Log Alerts 상태 요약
- 연결 상태 확인
- 최근 활동 및 주요 지표

**표시 정보:**
- 연결 상태 (연결됨/미연결)
- 리소스 수량
- 최근 활동 요약

💡 **팁:** 각 카드 클릭으로 상세 페이지 이동`,
    relatedLinks: [
      { label: 'GitHub 연동', href: '/admin/github' },
      { label: 'Kubernetes 관리', href: '/admin/kubernetes' },
      { label: '포트 관리', href: '/admin/ports' },
    ],
  },

  'page-admin-ports': {
    id: 'page-admin-ports',
    title: '포트 관리',
    content: `개발 서버 포트 할당 관리 (Admin 전용)

**목적:** 개발 환경의 포트 할당을 체계적으로 관리합니다.

**주요 기능:**
- 포트 목록: 포트 생성/수정/삭제
- 포트 스캐너: Docker/시스템 포트 실시간 스캔
- 포트 비교: 등록 포트 vs 실제 활성 포트 비교
- 포트 가이드: 신규 개발 시 포트 추천

**탭 구성:**
- 목록: 등록된 포트 관리
- 스캐너: 실시간 포트 스캔
- 비교: 등록 vs 활성 포트 비교
- 가이드: 포트 할당 가이드

💡 **팁:** 포트 비교 탭에서 미등록 활성 포트 발견 가능`,
    relatedLinks: [
      { label: '포트 목록 (Public)', href: '/ports' },
    ],
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

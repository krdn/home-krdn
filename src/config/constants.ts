/**
 * 애플리케이션 전역 상수 정의
 * 하드코딩된 값들을 중앙에서 관리합니다.
 */

/**
 * 폴링 간격 설정 (밀리초)
 * API 호출 주기를 정의합니다.
 */
export const POLLING_INTERVALS = {
  /** 시스템 메트릭 새로고침 간격 (기본: 5초) */
  SYSTEM_METRICS: 5000,
  /** 컨테이너 목록 새로고침 간격 (기본: 10초) */
  CONTAINERS: 10000,
  /** 컨테이너 액션 후 새로고침 지연 (기본: 1초) */
  CONTAINER_ACTION_DELAY: 1000,
} as const;

/**
 * Docker 관련 설정
 */
export const DOCKER_CONFIG = {
  /** 로그 조회 시 기본 줄 수 */
  DEFAULT_LOG_TAIL_LINES: 100,
} as const;

/**
 * 인증 관련 설정
 * 인증 로직에서 사용되는 상수입니다.
 */
export const AUTH_CONFIG = {
  /** 세션 만료 시간 (초) - 기본: 24시간 */
  SESSION_MAX_AGE: 86400,
  /** 토큰 재검증 주기 (초) - 기본: 1시간 */
  TOKEN_REVALIDATE_INTERVAL: 3600,
} as const;

/**
 * 알림 시스템 설정
 * 알림 엔진에서 사용되는 상수입니다.
 */
export const ALERT_CONFIG = {
  /** 기본 쿨다운 시간 (초) - 5분 */
  DEFAULT_COOLDOWN: 300,
  /** 최대 저장 알림 개수 */
  MAX_ALERTS: 100,
  /** 알림 Toast 기본 표시 시간 (ms) */
  TOAST_DURATION: 5000,
  /** Critical 알림 Toast 표시 시간 (ms) */
  TOAST_DURATION_CRITICAL: 10000,
} as const;

/**
 * WebSocket 설정
 * WebSocket 연결 및 heartbeat 관련 상수입니다.
 */
export const WEBSOCKET_CONFIG = {
  /** 재연결 시도 간격 (ms) - 기본: 3초 */
  RECONNECT_INTERVAL: 3000,
  /** 최대 재연결 시도 횟수 */
  MAX_RECONNECT_ATTEMPTS: 10,
  /** heartbeat 간격 (ms) - 기본: 30초 */
  HEARTBEAT_INTERVAL: 30000,
  /** heartbeat 응답 타임아웃 (ms) - 기본: 5초 */
  HEARTBEAT_TIMEOUT: 5000,
  /** 최대 재연결 대기 시간 (ms) - 기본: 30초 */
  MAX_RECONNECT_DELAY: 30000,
  /** 메트릭 브로드캐스트 간격 (ms) - POLLING_INTERVALS.SYSTEM_METRICS와 동일 */
  METRICS_BROADCAST_INTERVAL: 5000,
  /** 컨테이너 브로드캐스트 간격 (ms) - POLLING_INTERVALS.CONTAINERS와 동일 */
  CONTAINERS_BROADCAST_INTERVAL: 10000,
} as const;

/**
 * 이메일 알림 설정
 * Resend API를 통한 이메일 발송 관련 상수입니다.
 */
export const EMAIL_CONFIG = {
  /** 같은 규칙 이메일 쿨다운 시간 (분) - 기본: 30분 */
  DEFAULT_COOLDOWN_MINUTES: 30,
  /** 일일 발송 제한 (안전장치) */
  MAX_DAILY_EMAILS: 50,
  /** 이메일 제목 접두사 */
  SUBJECT_PREFIX: '[Home-KRDN]',
} as const;

// 타입 추론을 위한 타입 정의
export type PollingIntervalsType = typeof POLLING_INTERVALS;
export type DockerConfigType = typeof DOCKER_CONFIG;
export type AuthConfigType = typeof AUTH_CONFIG;
export type AlertConfigType = typeof ALERT_CONFIG;
export type WebSocketConfigType = typeof WEBSOCKET_CONFIG;
export type EmailConfigType = typeof EMAIL_CONFIG;

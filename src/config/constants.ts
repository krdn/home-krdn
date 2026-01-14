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

// 타입 추론을 위한 타입 정의
export type PollingIntervalsType = typeof POLLING_INTERVALS;
export type DockerConfigType = typeof DOCKER_CONFIG;
export type AuthConfigType = typeof AUTH_CONFIG;

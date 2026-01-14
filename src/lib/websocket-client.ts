/**
 * WebSocket Client Utilities
 * 클라이언트 측 WebSocket 연결 및 메시지 처리 유틸리티
 */
import { ZodError } from 'zod';
import {
  WSServerMessageSchema,
  type WSClientMessage,
  type WSServerMessage,
} from '@/types/websocket';

// ============================================================
// URL 생성
// ============================================================

/**
 * 현재 호스트 기반 WebSocket URL 생성
 * HTTPS 환경에서는 wss://, HTTP 환경에서는 ws:// 사용
 *
 * @param path WebSocket 엔드포인트 경로 (기본: '/api/ws')
 * @returns WebSocket URL 문자열
 */
export function getWebSocketUrl(path: string = '/api/ws'): string {
  // SSR 환경에서는 빈 문자열 반환
  if (typeof window === 'undefined') {
    return '';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;

  return `${protocol}//${host}${path}`;
}

// ============================================================
// 메시지 생성
// ============================================================

/**
 * 타입 안전한 클라이언트 메시지 생성
 *
 * @param type 메시지 타입
 * @param payload 메시지 페이로드 (type 제외)
 * @returns 완성된 클라이언트 메시지
 */
export function createMessage<T extends WSClientMessage['type']>(
  type: T,
  payload: Omit<Extract<WSClientMessage, { type: T }>, 'type' | 'timestamp'>
): Extract<WSClientMessage, { type: T }> {
  return {
    type,
    timestamp: Date.now(),
    ...payload,
  } as Extract<WSClientMessage, { type: T }>;
}

/**
 * 편의 함수: 구독 메시지 생성
 */
export function createSubscribeMessage(
  channel: 'metrics' | 'containers',
  interval?: number
) {
  return createMessage('subscribe', { channel, interval });
}

/**
 * 편의 함수: 구독 해제 메시지 생성
 */
export function createUnsubscribeMessage(channel: 'metrics' | 'containers') {
  return createMessage('unsubscribe', { channel });
}

/**
 * 편의 함수: Ping 메시지 생성
 */
export function createPingMessage() {
  return createMessage('ping', {});
}

/**
 * 편의 함수: 컨테이너 액션 메시지 생성
 */
export function createContainerActionMessage(
  action: 'start' | 'stop' | 'restart',
  containerId: string
) {
  return createMessage('container-action', { action, containerId });
}

// ============================================================
// 메시지 파싱
// ============================================================

/**
 * 서버 메시지 파싱 결과 타입
 */
export type ParseResult =
  | { success: true; data: WSServerMessage }
  | { success: false; error: string };

/**
 * 수신 메시지 파싱 및 Zod 검증
 *
 * @param data WebSocket 메시지 이벤트 데이터
 * @returns 파싱 결과 (성공 시 data, 실패 시 error)
 */
export function parseMessage(data: unknown): ParseResult {
  try {
    // MessageEvent의 data는 문자열
    const jsonString = typeof data === 'string' ? data : String(data);
    const parsed = JSON.parse(jsonString);

    // Zod로 런타임 검증
    const validated = WSServerMessageSchema.parse(parsed);

    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: `Validation failed: ${error.issues.map(i => i.message).join(', ')}`,
      };
    } else if (error instanceof SyntaxError) {
      return { success: false, error: `Invalid JSON: ${error.message}` };
    } else {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parse error',
      };
    }
  }
}

// ============================================================
// 연결 상태 타입
// ============================================================

/**
 * WebSocket 연결 상태
 */
export type ConnectionStatus =
  | 'connecting'    // 연결 시도 중
  | 'connected'     // 연결됨
  | 'disconnected'  // 연결 끊김
  | 'error';        // 에러 발생

/**
 * WebSocket 이벤트 콜백 타입
 */
export interface WebSocketCallbacks {
  onOpen?: (event: Event) => void;
  onMessage?: (message: WSServerMessage) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

// ============================================================
// 유틸리티
// ============================================================

/**
 * Exponential backoff 계산
 *
 * @param attempt 현재 재연결 시도 횟수 (0부터 시작)
 * @param baseDelay 기본 지연 시간 (ms)
 * @param maxDelay 최대 지연 시간 (ms)
 * @returns 계산된 지연 시간 (ms)
 */
export function calculateBackoff(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  // baseDelay * 2^attempt, 최대 maxDelay
  const delay = baseDelay * Math.pow(2, attempt);
  return Math.min(delay, maxDelay);
}

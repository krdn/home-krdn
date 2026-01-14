'use client';

/**
 * useWebSocket Hook
 * 자동 재연결, heartbeat, 타입 안전한 메시지 처리를 갖춘 React 훅
 */
import { useRef, useState, useEffect, useCallback } from 'react';
import { WEBSOCKET_CONFIG } from '@/config/constants';
import {
  getWebSocketUrl,
  parseMessage,
  createPingMessage,
  calculateBackoff,
  type ConnectionStatus,
} from '@/lib/websocket-client';
import type { WSClientMessage, WSServerMessage } from '@/types/websocket';

// ============================================================
// 타입 정의
// ============================================================

/**
 * useWebSocket 훅 옵션
 */
export interface UseWebSocketOptions {
  /** 연결할 WebSocket URL (기본: /api/ws) */
  url?: string;
  /** 자동 연결 여부 (기본: true) */
  autoConnect?: boolean;
  /** 재연결 활성화 여부 (기본: true) */
  enableReconnect?: boolean;
  /** heartbeat 활성화 여부 (기본: true) */
  enableHeartbeat?: boolean;
  /** 메시지 히스토리 최대 개수 (기본: 10) */
  maxMessageHistory?: number;
  /** 연결 성공 콜백 */
  onConnected?: (clientId: string) => void;
  /** 메시지 수신 콜백 */
  onMessage?: (message: WSServerMessage) => void;
  /** 에러 발생 콜백 */
  onError?: (error: Event | string) => void;
  /** 연결 종료 콜백 */
  onDisconnected?: () => void;
}

/**
 * useWebSocket 훅 반환값
 */
export interface UseWebSocketReturn<T = unknown> {
  /** 연결 상태 */
  connectionStatus: ConnectionStatus;
  /** 마지막 수신 메시지 */
  lastMessage: WSServerMessage | null;
  /** 최근 메시지 히스토리 */
  messageHistory: WSServerMessage[];
  /** 메시지 전송 함수 */
  sendMessage: (message: WSClientMessage) => boolean;
  /** 수동 연결 함수 */
  connect: () => void;
  /** 수동 연결 종료 함수 */
  disconnect: () => void;
  /** 재연결 시도 함수 */
  reconnect: () => void;
  /** 클라이언트 ID (연결 후) */
  clientId: string | null;
  /** 재연결 시도 횟수 */
  reconnectAttempt: number;
}

// ============================================================
// 훅 구현
// ============================================================

/**
 * WebSocket 연결을 관리하는 React 훅
 *
 * @param options 설정 옵션
 * @returns WebSocket 상태 및 제어 함수
 *
 * @example
 * ```tsx
 * const { connectionStatus, lastMessage, sendMessage } = useWebSocket({
 *   onMessage: (msg) => {
 *     if (msg.type === 'metrics') {
 *       setMetrics(msg.data);
 *     }
 *   },
 * });
 *
 * // 채널 구독
 * sendMessage(createSubscribeMessage('metrics'));
 * ```
 */
export function useWebSocket<T = unknown>(
  options: UseWebSocketOptions = {}
): UseWebSocketReturn<T> {
  const {
    url = getWebSocketUrl(),
    autoConnect = true,
    enableReconnect = true,
    enableHeartbeat = true,
    maxMessageHistory = 10,
    onConnected,
    onMessage,
    onError,
    onDisconnected,
  } = options;

  // ============================================================
  // State
  // ============================================================

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WSServerMessage | null>(null);
  const [messageHistory, setMessageHistory] = useState<WSServerMessage[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  // ============================================================
  // Refs (인스턴스 유지)
  // ============================================================

  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmountedRef = useRef(false);
  const manualDisconnectRef = useRef(false);

  // ============================================================
  // Cleanup 함수
  // ============================================================

  /**
   * 타이머 정리
   */
  const clearTimers = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // ============================================================
  // Heartbeat 로직
  // ============================================================

  /**
   * Heartbeat 시작
   */
  const startHeartbeat = useCallback(() => {
    if (!enableHeartbeat) return;

    // 기존 타이머 정리
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // Ping 전송
        const pingMessage = createPingMessage();
        wsRef.current.send(JSON.stringify(pingMessage));
        console.log('[WS] Heartbeat ping sent');

        // Pong 타임아웃 설정
        heartbeatTimeoutRef.current = setTimeout(() => {
          console.warn('[WS] Heartbeat timeout - reconnecting');
          // 연결 끊기 (onclose에서 재연결 시도)
          wsRef.current?.close();
        }, WEBSOCKET_CONFIG.HEARTBEAT_TIMEOUT);
      }
    }, WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL);
  }, [enableHeartbeat]);

  /**
   * Heartbeat 응답 처리 (pong 수신)
   */
  const handleHeartbeatResponse = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  // ============================================================
  // 재연결 로직
  // ============================================================

  /**
   * 재연결 예약
   */
  const scheduleReconnect = useCallback(() => {
    if (!enableReconnect || manualDisconnectRef.current || isUnmountedRef.current) {
      return;
    }

    if (reconnectAttempt >= WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.error('[WS] Max reconnection attempts reached');
      setConnectionStatus('error');
      return;
    }

    const delay = calculateBackoff(
      reconnectAttempt,
      WEBSOCKET_CONFIG.RECONNECT_INTERVAL,
      WEBSOCKET_CONFIG.MAX_RECONNECT_DELAY
    );

    console.log(`[WS] Scheduling reconnect in ${delay}ms (attempt ${reconnectAttempt + 1})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      if (!isUnmountedRef.current && !manualDisconnectRef.current) {
        setReconnectAttempt(prev => prev + 1);
        connect();
      }
    }, delay);
  }, [enableReconnect, reconnectAttempt]);

  // ============================================================
  // 연결 관리
  // ============================================================

  /**
   * WebSocket 연결
   */
  const connect = useCallback(() => {
    // SSR 체크
    if (typeof window === 'undefined' || !url) {
      return;
    }

    // 이미 연결 중이면 무시
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    // 기존 연결 정리
    if (wsRef.current) {
      wsRef.current.close();
    }

    manualDisconnectRef.current = false;
    setConnectionStatus('connecting');

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      // ============================================================
      // 이벤트 핸들러
      // ============================================================

      ws.onopen = () => {
        if (isUnmountedRef.current) return;

        console.log('[WS] Connected');
        setConnectionStatus('connected');
        setReconnectAttempt(0);
        startHeartbeat();
      };

      ws.onmessage = (event) => {
        if (isUnmountedRef.current) return;

        const result = parseMessage(event.data);

        if (!result.success) {
          console.error('[WS] Parse error:', result.error);
          return;
        }

        const message = result.data;

        // 메시지 타입별 처리
        switch (message.type) {
          case 'connected':
            setClientId(message.clientId);
            onConnected?.(message.clientId);
            break;

          case 'heartbeat':
            console.log('[WS] Heartbeat pong received');
            handleHeartbeatResponse();
            break;

          default:
            // 일반 메시지 처리
            setLastMessage(message);
            setMessageHistory(prev => {
              const next = [message, ...prev];
              return next.slice(0, maxMessageHistory);
            });
            onMessage?.(message);
        }
      };

      ws.onerror = (event) => {
        if (isUnmountedRef.current) return;

        console.error('[WS] Error:', event);
        setConnectionStatus('error');
        onError?.(event);
      };

      ws.onclose = (event) => {
        if (isUnmountedRef.current) return;

        console.log('[WS] Disconnected', event.code, event.reason);
        clearTimers();
        setConnectionStatus('disconnected');
        onDisconnected?.();

        // 정상 종료가 아니고 수동 종료도 아니면 재연결 시도
        if (event.code !== 1000 && !manualDisconnectRef.current) {
          scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('[WS] Connection error:', error);
      setConnectionStatus('error');
      onError?.(String(error));
    }
  }, [
    url,
    startHeartbeat,
    handleHeartbeatResponse,
    clearTimers,
    scheduleReconnect,
    maxMessageHistory,
    onConnected,
    onMessage,
    onError,
    onDisconnected,
  ]);

  /**
   * 연결 종료
   */
  const disconnect = useCallback(() => {
    manualDisconnectRef.current = true;
    clearTimers();

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setConnectionStatus('disconnected');
    setClientId(null);
  }, [clearTimers]);

  /**
   * 재연결 (수동)
   */
  const reconnect = useCallback(() => {
    disconnect();
    setReconnectAttempt(0);
    manualDisconnectRef.current = false;

    // 약간의 지연 후 연결
    setTimeout(() => {
      if (!isUnmountedRef.current) {
        connect();
      }
    }, 100);
  }, [disconnect, connect]);

  // ============================================================
  // 메시지 전송
  // ============================================================

  /**
   * 메시지 전송
   */
  const sendMessage = useCallback((message: WSClientMessage): boolean => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Cannot send message - not connected');
      return false;
    }

    try {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('[WS] Send error:', error);
      return false;
    }
  }, []);

  // ============================================================
  // Effects
  // ============================================================

  /**
   * 자동 연결
   */
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      isUnmountedRef.current = true;
      clearTimers();
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmount');
      }
    };
  }, [autoConnect, connect, clearTimers]);

  // ============================================================
  // 반환
  // ============================================================

  return {
    connectionStatus,
    lastMessage,
    messageHistory,
    sendMessage,
    connect,
    disconnect,
    reconnect,
    clientId,
    reconnectAttempt,
  };
}

// ============================================================
// 타입 가드 헬퍼
// ============================================================

/**
 * 메트릭 메시지 타입 가드
 */
export function isMetricsMessage(msg: WSServerMessage): msg is Extract<WSServerMessage, { type: 'metrics' }> {
  return msg.type === 'metrics';
}

/**
 * 컨테이너 목록 메시지 타입 가드
 */
export function isContainersMessage(msg: WSServerMessage): msg is Extract<WSServerMessage, { type: 'containers' }> {
  return msg.type === 'containers';
}

/**
 * 컨테이너 액션 응답 메시지 타입 가드
 */
export function isContainerAckMessage(msg: WSServerMessage): msg is Extract<WSServerMessage, { type: 'container-ack' }> {
  return msg.type === 'container-ack';
}

/**
 * 에러 메시지 타입 가드
 */
export function isErrorMessage(msg: WSServerMessage): msg is Extract<WSServerMessage, { type: 'error' }> {
  return msg.type === 'error';
}

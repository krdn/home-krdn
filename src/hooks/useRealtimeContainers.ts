'use client';

/**
 * useRealtimeContainers Hook
 * WebSocket 기반 실시간 컨테이너 목록 훅
 *
 * useContainers와 동일한 반환 형태를 제공하면서,
 * WebSocket을 통해 실시간으로 컨테이너 목록을 수신합니다.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useWebSocket, isContainersMessage, isContainerAckMessage, isErrorMessage } from '@/hooks/useWebSocket';
import { useContainers, type ContainerData, type ContainerSummary } from '@/hooks/useContainers';
import { createSubscribeMessage, createContainerActionMessage } from '@/lib/websocket-client';
import type { ConnectionStatus } from '@/lib/websocket-client';
import type { WSContainersData, WSServerMessage } from '@/types/websocket';
import { DOCKER_CONFIG } from '@/config/constants';

// ============================================================
// 타입 정의
// ============================================================

export interface UseRealtimeContainersOptions {
  /** WebSocket 실패 시 폴링 fallback 활성화 (기본: true) */
  enableFallback?: boolean;
  /** 자동 연결 여부 (기본: true) */
  autoConnect?: boolean;
}

export interface UseRealtimeContainersReturn {
  /** 컨테이너 목록 */
  containers: ContainerData[];
  /** 컨테이너 요약 정보 */
  summary: ContainerSummary | null;
  /** 로딩 상태 */
  loading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** WebSocket 연결 상태 */
  connectionStatus: ConnectionStatus;
  /** 데이터 소스 ('websocket' | 'polling') */
  source: 'websocket' | 'polling';
  /** 수동 연결 함수 */
  connect: () => void;
  /** 수동 연결 종료 함수 */
  disconnect: () => void;
  /** 컨테이너 액션 (start/stop/restart) - WebSocket 통해 전송 */
  performAction: (id: string, action: 'start' | 'stop' | 'restart') => Promise<{ success: boolean; message: string }>;
  /** 컨테이너 로그 조회 - HTTP API 사용 */
  getLogs: (id: string, tail?: number) => Promise<{ success: boolean; logs: string; error?: string }>;
}

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * WSContainersData를 ContainerData로 변환
 */
function transformContainersData(wsData: WSContainersData[]): ContainerData[] {
  return wsData.map((c) => ({
    id: c.id,
    name: c.name,
    image: c.image,
    state: c.state as ContainerData['state'],
    status: c.status,
    ports: c.ports,
    created: c.created,
  }));
}

/**
 * ContainerData[]에서 ContainerSummary 계산
 */
function calculateSummary(containers: ContainerData[]): ContainerSummary {
  const running = containers.filter((c) => c.state === 'running').length;
  return {
    total: containers.length,
    running,
    stopped: containers.length - running,
  };
}

// ============================================================
// 훅 구현
// ============================================================

/**
 * WebSocket 기반 실시간 컨테이너 훅
 *
 * @param options 설정 옵션
 * @returns 컨테이너 데이터 및 연결 상태
 *
 * @example
 * ```tsx
 * // 기존 useContainers 대체
 * const { containers, summary, loading, error } = useRealtimeContainers();
 *
 * // 연결 상태 확인
 * const { containers, connectionStatus, source } = useRealtimeContainers();
 * if (source === 'polling') {
 *   console.log('WebSocket 실패, 폴링으로 동작 중');
 * }
 *
 * // 컨테이너 액션
 * const result = await performAction(containerId, 'restart');
 * ```
 */
export function useRealtimeContainers(
  options: UseRealtimeContainersOptions = {}
): UseRealtimeContainersReturn {
  const { enableFallback = true, autoConnect = true } = options;

  // ============================================================
  // State
  // ============================================================

  const [containers, setContainers] = useState<ContainerData[]>([]);
  const [summary, setSummary] = useState<ContainerSummary | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  // 메시지 수신 여부 추적
  const hasReceivedMessage = useRef(false);

  // 액션 응답 대기를 위한 Promise 관리
  const pendingActionsRef = useRef<Map<string, { resolve: (result: { success: boolean; message: string }) => void }>>(new Map());

  // ============================================================
  // WebSocket 연결
  // ============================================================

  const handleConnected = useCallback(() => {
    console.log('[RealtimeContainers] Connected, subscribing to containers channel');
    setWsError(null);
  }, []);

  const handleMessage = useCallback((msg: WSServerMessage) => {
    if (isContainersMessage(msg)) {
      hasReceivedMessage.current = true;
      const transformedContainers = transformContainersData(msg.data);
      setContainers(transformedContainers);
      setSummary(calculateSummary(transformedContainers));
      setWsError(null);
      // WebSocket이 작동하면 fallback 비활성화
      if (useFallback) {
        setUseFallback(false);
      }
    } else if (isContainerAckMessage(msg)) {
      // 액션 응답 처리
      const key = `${msg.action}-${msg.containerId}`;
      const pending = pendingActionsRef.current.get(key);
      if (pending) {
        pending.resolve({ success: msg.success, message: msg.message || '' });
        pendingActionsRef.current.delete(key);
      }
    } else if (isErrorMessage(msg)) {
      setWsError(msg.message);
    }
  }, [useFallback]);

  const handleError = useCallback(() => {
    console.warn('[RealtimeContainers] WebSocket error');
    if (enableFallback && !useFallback) {
      console.log('[RealtimeContainers] Switching to polling fallback');
      setUseFallback(true);
    }
  }, [enableFallback, useFallback]);

  const {
    connectionStatus,
    sendMessage,
    connect: wsConnect,
    disconnect: wsDisconnect,
  } = useWebSocket({
    autoConnect,
    onConnected: () => {
      handleConnected();
      // 연결 성공 시 containers 채널 구독
      sendMessage(createSubscribeMessage('containers'));
    },
    onMessage: handleMessage,
    onError: handleError,
  });

  // ============================================================
  // Fallback: 폴링 기반 컨테이너 (enableFallback이 true이고 WebSocket 실패 시)
  // ============================================================

  const fallbackContainers = useContainers(useFallback ? undefined : 0);

  // Fallback 데이터 사용 시 상태 업데이트
  useEffect(() => {
    if (useFallback && fallbackContainers.containers.length > 0) {
      setContainers(fallbackContainers.containers);
      setSummary(fallbackContainers.summary);
    }
  }, [useFallback, fallbackContainers.containers, fallbackContainers.summary]);

  // ============================================================
  // 연결 상태에 따른 자동 fallback
  // ============================================================

  useEffect(() => {
    // 연결 에러 상태이고 fallback이 활성화되어 있으면 폴링으로 전환
    if (connectionStatus === 'error' && enableFallback && !useFallback) {
      console.log('[RealtimeContainers] Connection error, switching to polling');
      setUseFallback(true);
    }
  }, [connectionStatus, enableFallback, useFallback]);

  // ============================================================
  // 액션 및 로그 함수
  // ============================================================

  /**
   * 컨테이너 액션 수행 (WebSocket을 통해)
   */
  const performAction = useCallback(async (
    id: string,
    action: 'start' | 'stop' | 'restart'
  ): Promise<{ success: boolean; message: string }> => {
    // WebSocket이 연결되어 있으면 WebSocket 통해 전송
    if (connectionStatus === 'connected' && !useFallback) {
      return new Promise((resolve) => {
        const key = `${action}-${id}`;

        // 타임아웃 설정 (10초)
        const timeout = setTimeout(() => {
          pendingActionsRef.current.delete(key);
          resolve({ success: false, message: 'Action timeout' });
        }, 10000);

        pendingActionsRef.current.set(key, {
          resolve: (result) => {
            clearTimeout(timeout);
            resolve(result);
          },
        });

        const sent = sendMessage(createContainerActionMessage(action, id));
        if (!sent) {
          clearTimeout(timeout);
          pendingActionsRef.current.delete(key);
          resolve({ success: false, message: 'Failed to send message' });
        }
      });
    }

    // Fallback: HTTP API 사용
    return fallbackContainers.performAction(id, action);
  }, [connectionStatus, useFallback, sendMessage, fallbackContainers]);

  /**
   * 컨테이너 로그 조회 (HTTP API 사용 - 로그는 대용량이라 WebSocket 비적합)
   */
  const getLogs = useCallback(async (
    id: string,
    tail: number = DOCKER_CONFIG.DEFAULT_LOG_TAIL_LINES
  ): Promise<{ success: boolean; logs: string; error?: string }> => {
    return fallbackContainers.getLogs(id, tail);
  }, [fallbackContainers]);

  // ============================================================
  // 공개 API
  // ============================================================

  const connect = useCallback(() => {
    setUseFallback(false);
    hasReceivedMessage.current = false;
    wsConnect();
  }, [wsConnect]);

  const disconnect = useCallback(() => {
    wsDisconnect();
    if (enableFallback) {
      setUseFallback(true);
    }
  }, [wsDisconnect, enableFallback]);

  // ============================================================
  // 반환값 계산
  // ============================================================

  // 데이터 소스 결정
  const source: 'websocket' | 'polling' = useFallback ? 'polling' : 'websocket';

  // 로딩 상태
  const loading = useFallback
    ? fallbackContainers.loading
    : connectionStatus === 'connecting' && containers.length === 0;

  // 에러 상태
  const error = useFallback ? fallbackContainers.error : wsError;

  return {
    containers,
    summary,
    loading,
    error,
    connectionStatus,
    source,
    connect,
    disconnect,
    performAction,
    getLogs,
  };
}

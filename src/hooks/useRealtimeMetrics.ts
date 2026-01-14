'use client';

/**
 * useRealtimeMetrics Hook
 * WebSocket 기반 실시간 시스템 메트릭 훅
 *
 * useSystemMetrics와 동일한 반환 형태를 제공하면서,
 * WebSocket을 통해 실시간으로 메트릭을 수신합니다.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useWebSocket, isMetricsMessage, isErrorMessage } from '@/hooks/useWebSocket';
import { useSystemMetrics, type SystemMetricsData } from '@/hooks/useSystemMetrics';
import { createSubscribeMessage } from '@/lib/websocket-client';
import type { ConnectionStatus } from '@/lib/websocket-client';
import type { WSMetricsData, WSServerMessage } from '@/types/websocket';

// ============================================================
// 타입 정의
// ============================================================

export interface UseRealtimeMetricsOptions {
  /** WebSocket 실패 시 폴링 fallback 활성화 (기본: true) */
  enableFallback?: boolean;
  /** 자동 연결 여부 (기본: true) */
  autoConnect?: boolean;
}

export interface UseRealtimeMetricsReturn {
  /** 메트릭 데이터 */
  data: SystemMetricsData | null;
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
}

// ============================================================
// 유틸리티
// ============================================================

/**
 * bytes를 읽기 쉬운 형태로 포맷
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 초를 읽기 쉬운 형태로 포맷 (예: "2일 3시간")
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}일 ${hours}시간`;
  } else if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  } else {
    return `${minutes}분`;
  }
}

/**
 * WSMetricsData를 SystemMetricsData로 변환
 * WebSocket에서 받은 경량화된 데이터를 기존 API 형태로 변환
 */
function transformMetricsData(wsData: WSMetricsData): SystemMetricsData {
  return {
    cpu: {
      usage: wsData.cpu.usage,
      cores: wsData.cpu.cores,
      model: '', // WebSocket 메시지에 미포함 (경량화)
      loadAvg: wsData.cpu.loadAvg.map(v => v.toFixed(2)),
    },
    memory: {
      total: formatBytes(wsData.memory.total),
      used: formatBytes(wsData.memory.used),
      free: formatBytes(wsData.memory.free),
      usage: wsData.memory.usage,
      totalBytes: wsData.memory.total,
      usedBytes: wsData.memory.used,
    },
    disk: {
      total: formatBytes(wsData.disk.total),
      used: formatBytes(wsData.disk.used),
      free: formatBytes(wsData.disk.free),
      usage: wsData.disk.usage,
      path: wsData.disk.path,
    },
    network: [], // WebSocket 메시지에 미포함 (경량화)
    processes: [], // WebSocket 메시지에 미포함 (경량화)
    uptime: formatUptime(wsData.uptime),
    uptimeSeconds: wsData.uptime,
    hostname: wsData.hostname,
    platform: '', // WebSocket 메시지에 미포함 (경량화)
  };
}

// ============================================================
// 훅 구현
// ============================================================

/**
 * WebSocket 기반 실시간 메트릭 훅
 *
 * @param options 설정 옵션
 * @returns 메트릭 데이터 및 연결 상태
 *
 * @example
 * ```tsx
 * // 기존 useSystemMetrics 대체
 * const { data, loading, error } = useRealtimeMetrics();
 *
 * // 연결 상태 확인
 * const { data, connectionStatus, source } = useRealtimeMetrics();
 * if (source === 'polling') {
 *   console.log('WebSocket 실패, 폴링으로 동작 중');
 * }
 * ```
 */
export function useRealtimeMetrics(
  options: UseRealtimeMetricsOptions = {}
): UseRealtimeMetricsReturn {
  const { enableFallback = true, autoConnect = true } = options;

  // ============================================================
  // State
  // ============================================================

  const [metrics, setMetrics] = useState<SystemMetricsData | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  // 메시지 수신 여부 추적 (WebSocket 작동 여부 판단)
  const hasReceivedMessage = useRef(false);

  // ============================================================
  // WebSocket 연결
  // ============================================================

  const handleConnected = useCallback(() => {
    console.log('[RealtimeMetrics] Connected, subscribing to metrics channel');
    setWsError(null);
  }, []);

  const handleMessage = useCallback((msg: WSServerMessage) => {
    if (isMetricsMessage(msg)) {
      hasReceivedMessage.current = true;
      setMetrics(transformMetricsData(msg.data));
      setWsError(null);
      // WebSocket이 작동하면 fallback 비활성화
      if (useFallback) {
        setUseFallback(false);
      }
    } else if (isErrorMessage(msg)) {
      setWsError(msg.message);
    }
  }, [useFallback]);

  const handleError = useCallback(() => {
    console.warn('[RealtimeMetrics] WebSocket error');
    if (enableFallback && !useFallback) {
      console.log('[RealtimeMetrics] Switching to polling fallback');
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
    onConnected: (clientId) => {
      handleConnected();
      // 연결 성공 시 metrics 채널 구독
      sendMessage(createSubscribeMessage('metrics'));
    },
    onMessage: handleMessage,
    onError: handleError,
  });

  // ============================================================
  // Fallback: 폴링 기반 메트릭 (enableFallback이 true이고 WebSocket 실패 시)
  // ============================================================

  const fallbackMetrics = useSystemMetrics(useFallback ? undefined : 0);

  // Fallback 데이터 사용 시 상태 업데이트
  useEffect(() => {
    if (useFallback && fallbackMetrics.data) {
      setMetrics(fallbackMetrics.data);
    }
  }, [useFallback, fallbackMetrics.data]);

  // ============================================================
  // 연결 상태에 따른 자동 fallback
  // ============================================================

  useEffect(() => {
    // 연결 에러 상태이고 fallback이 활성화되어 있으면 폴링으로 전환
    if (connectionStatus === 'error' && enableFallback && !useFallback) {
      console.log('[RealtimeMetrics] Connection error, switching to polling');
      setUseFallback(true);
    }
  }, [connectionStatus, enableFallback, useFallback]);

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
    ? fallbackMetrics.loading
    : connectionStatus === 'connecting' && metrics === null;

  // 에러 상태
  const error = useFallback ? fallbackMetrics.error : wsError;

  return {
    data: metrics,
    loading,
    error,
    connectionStatus,
    source,
    connect,
    disconnect,
  };
}

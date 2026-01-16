'use client';

/**
 * useLogStream Hook
 * WebSocket 기반 실시간 로그 스트림 구독 훅
 *
 * Phase 37: Log Viewer UI
 * - 실시간 로그 구독/해제
 * - 소스/레벨/컨테이너 필터링
 * - 메모리 관리 (최대 로그 수 제한)
 */
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { ConnectionStatus } from '@/lib/websocket-client';
import type {
  WSServerMessage,
  WSLogEntry,
  WSLogSource,
  WSLogLevel,
} from '@/types/websocket';
import type { LogEntry, LogLevel, LogSource } from '@/types/log';

// ============================================================
// 타입 정의
// ============================================================

/**
 * 로그 스트림 옵션
 */
export interface LogStreamOptions {
  /** 구독할 소스 (미지정 시 전체) */
  sources?: LogSource[];
  /** 최소 로그 레벨 */
  minLevel?: LogLevel;
  /** 특정 컨테이너 ID 목록 */
  containers?: string[];
  /** 자동 구독 여부 (기본: true) */
  enabled?: boolean;
  /** 최대 로그 보관 개수 (기본: 1000) */
  maxLogs?: number;
}

/**
 * useLogStream 훅 반환값
 */
export interface UseLogStreamReturn {
  /** 로그 목록 */
  logs: LogEntry[];
  /** 스트리밍 중 여부 */
  isStreaming: boolean;
  /** WebSocket 연결 상태 */
  connectionStatus: ConnectionStatus;
  /** 스트림 시작 */
  startStream: () => void;
  /** 스트림 중지 */
  stopStream: () => void;
  /** 로그 클리어 */
  clearLogs: () => void;
  /** 에러 메시지 */
  error: string | null;
}

// ============================================================
// 상수
// ============================================================

const DEFAULT_MAX_LOGS = 1000;

// ============================================================
// 유틸리티
// ============================================================

/**
 * WSLogEntry를 LogEntry로 변환
 */
function transformLogEntry(wsEntry: WSLogEntry): LogEntry {
  return {
    id: wsEntry.id,
    source: wsEntry.source as LogSource,
    sourceId: wsEntry.sourceId,
    level: wsEntry.level as LogLevel,
    message: wsEntry.message,
    timestamp: new Date(wsEntry.timestamp),
  };
}

/**
 * 로그 메시지 타입 가드
 */
function isLogMessage(
  msg: WSServerMessage
): msg is Extract<WSServerMessage, { type: 'logs' }> {
  return msg.type === 'logs';
}

/**
 * 에러 메시지 타입 가드
 */
function isErrorMessage(
  msg: WSServerMessage
): msg is Extract<WSServerMessage, { type: 'error' }> {
  return msg.type === 'error';
}

// ============================================================
// 훅 구현
// ============================================================

/**
 * WebSocket 기반 실시간 로그 스트림 훅
 *
 * @param options 스트림 옵션
 * @returns 로그 데이터 및 제어 함수
 *
 * @example
 * ```tsx
 * // 기본 사용
 * const { logs, isStreaming, startStream, stopStream } = useLogStream();
 *
 * // 필터링 옵션
 * const { logs } = useLogStream({
 *   sources: ['docker'],
 *   minLevel: 'warn',
 *   containers: ['nginx', 'postgres'],
 * });
 * ```
 */
export function useLogStream(options: LogStreamOptions = {}): UseLogStreamReturn {
  const {
    sources,
    minLevel,
    containers,
    enabled = true,
    maxLogs = DEFAULT_MAX_LOGS,
  } = options;

  // ============================================================
  // State
  // ============================================================

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 구독 상태 추적 (중복 구독 방지)
  const isSubscribedRef = useRef(false);

  // ============================================================
  // WebSocket 연결
  // ============================================================

  const handleMessage = useCallback(
    (msg: WSServerMessage) => {
      if (isLogMessage(msg)) {
        // 새 로그 추가 (최대 개수 유지)
        const newEntries = msg.data.map(transformLogEntry);
        setLogs((prev) => {
          const updated = [...newEntries, ...prev];
          // 최대 개수 초과 시 오래된 것부터 제거
          return updated.slice(0, maxLogs);
        });
        setError(null);
      } else if (isErrorMessage(msg)) {
        setError(msg.message);
      }
    },
    [maxLogs]
  );

  const handleConnected = useCallback(() => {
    console.log('[LogStream] Connected');
    setError(null);
  }, []);

  const handleDisconnected = useCallback(() => {
    console.log('[LogStream] Disconnected');
    setIsStreaming(false);
    isSubscribedRef.current = false;
  }, []);

  const handleError = useCallback(() => {
    console.warn('[LogStream] WebSocket error');
    setIsStreaming(false);
    isSubscribedRef.current = false;
  }, []);

  const {
    connectionStatus,
    sendMessage,
    connect,
    disconnect,
  } = useWebSocket({
    autoConnect: enabled,
    onConnected: handleConnected,
    onMessage: handleMessage,
    onDisconnected: handleDisconnected,
    onError: handleError,
  });

  // ============================================================
  // 구독 메시지 생성
  // ============================================================

  const subscribeMessage = useMemo(
    () => ({
      type: 'subscribe-logs' as const,
      sources: sources as WSLogSource[] | undefined,
      containers,
      minLevel: minLevel as WSLogLevel | undefined,
      timestamp: Date.now(),
    }),
    [sources, containers, minLevel]
  );

  const unsubscribeMessage = useMemo(
    () => ({
      type: 'unsubscribe-logs' as const,
      timestamp: Date.now(),
    }),
    []
  );

  // ============================================================
  // 스트림 제어
  // ============================================================

  /**
   * 로그 스트림 시작
   */
  const startStream = useCallback(() => {
    if (connectionStatus !== 'connected') {
      console.warn('[LogStream] Cannot start stream - not connected');
      connect();
      return;
    }

    if (isSubscribedRef.current) {
      console.log('[LogStream] Already subscribed');
      return;
    }

    console.log('[LogStream] Starting stream with options:', {
      sources,
      minLevel,
      containers,
    });

    const sent = sendMessage({
      ...subscribeMessage,
      timestamp: Date.now(),
    });

    if (sent) {
      isSubscribedRef.current = true;
      setIsStreaming(true);
      setError(null);
    }
  }, [connectionStatus, connect, sendMessage, subscribeMessage, sources, minLevel, containers]);

  /**
   * 로그 스트림 중지
   */
  const stopStream = useCallback(() => {
    if (!isSubscribedRef.current) {
      console.log('[LogStream] Not subscribed');
      return;
    }

    console.log('[LogStream] Stopping stream');

    sendMessage({
      ...unsubscribeMessage,
      timestamp: Date.now(),
    });

    isSubscribedRef.current = false;
    setIsStreaming(false);
  }, [sendMessage, unsubscribeMessage]);

  /**
   * 로그 클리어
   */
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // ============================================================
  // Effects
  // ============================================================

  /**
   * 연결 성공 시 자동 구독
   */
  useEffect(() => {
    if (enabled && connectionStatus === 'connected' && !isSubscribedRef.current) {
      // 약간의 지연 후 구독 (연결 안정화)
      const timer = setTimeout(() => {
        startStream();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [enabled, connectionStatus, startStream]);

  /**
   * 필터 옵션 변경 시 재구독
   */
  useEffect(() => {
    if (isSubscribedRef.current && connectionStatus === 'connected') {
      // 기존 구독 해제 후 새 옵션으로 재구독
      stopStream();
      const timer = setTimeout(() => {
        startStream();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [sources, minLevel, containers]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * 컴포넌트 언마운트 시 구독 해제
   */
  useEffect(() => {
    return () => {
      if (isSubscribedRef.current) {
        sendMessage({
          type: 'unsubscribe-logs',
          timestamp: Date.now(),
        });
      }
    };
  }, [sendMessage]);

  // ============================================================
  // 반환
  // ============================================================

  return {
    logs,
    isStreaming,
    connectionStatus,
    startStream,
    stopStream,
    clearLogs,
    error,
  };
}

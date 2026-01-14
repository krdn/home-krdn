/**
 * WebSocket Server Utilities
 * 클라이언트 연결 관리 및 메시지 처리 로직
 */
import type { WebSocket } from 'ws';
import { ZodError } from 'zod';
import {
  WSClientMessageSchema,
  WSServerMessage,
  type WSClientMessage,
  type WSClientState,
  type WSChannel,
  type WSMetricsData,
} from '@/types/websocket';
import { getSystemMetrics } from '@/lib/system';

// ============================================================
// 클라이언트 관리
// ============================================================

/** 연결된 WebSocket 클라이언트 목록 */
const connectedClients = new Map<WebSocket, WSClientState>();

/** 다음 클라이언트 ID */
let nextClientId = 1;

/**
 * 새 클라이언트 ID 생성
 */
function generateClientId(): string {
  return `client-${nextClientId++}-${Date.now().toString(36)}`;
}

/**
 * 클라이언트 추가
 */
export function addClient(ws: WebSocket): WSClientState {
  const clientState: WSClientState = {
    id: generateClientId(),
    subscriptions: new Set(),
    lastPing: Date.now(),
  };
  connectedClients.set(ws, clientState);
  console.log(`[WS] Client ${clientState.id} connected (total: ${connectedClients.size})`);
  return clientState;
}

/**
 * 클라이언트 제거
 */
export function removeClient(ws: WebSocket): void {
  const state = connectedClients.get(ws);
  if (state) {
    console.log(`[WS] Client ${state.id} disconnected (remaining: ${connectedClients.size - 1})`);
    connectedClients.delete(ws);
  }
}

/**
 * 클라이언트 상태 조회
 */
export function getClientState(ws: WebSocket): WSClientState | undefined {
  return connectedClients.get(ws);
}

/**
 * 연결된 클라이언트 수 조회
 */
export function getClientCount(): number {
  return connectedClients.size;
}

// ============================================================
// 메시지 전송
// ============================================================

/**
 * 특정 클라이언트에 메시지 전송
 */
export function sendToClient(ws: WebSocket, message: WSServerMessage): boolean {
  try {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  } catch (error) {
    console.error('[WS] Send error:', error);
    return false;
  }
}

/**
 * 모든 클라이언트에 메시지 브로드캐스트
 */
export function broadcast(message: WSServerMessage): number {
  let sentCount = 0;
  for (const [ws] of connectedClients) {
    if (sendToClient(ws, message)) {
      sentCount++;
    }
  }
  return sentCount;
}

/**
 * 특정 채널 구독자에게만 메시지 전송
 */
export function broadcastToChannel(channel: WSChannel, message: WSServerMessage): number {
  let sentCount = 0;
  for (const [ws, state] of connectedClients) {
    if (state.subscriptions.has(channel)) {
      if (sendToClient(ws, message)) {
        sentCount++;
      }
    }
  }
  return sentCount;
}

// ============================================================
// 메시지 처리
// ============================================================

/**
 * 수신 메시지 파싱 및 검증
 */
export function parseClientMessage(data: unknown): WSClientMessage | null {
  try {
    // Buffer 또는 string을 JSON으로 파싱
    const jsonString = typeof data === 'string' ? data : String(data);
    const parsed = JSON.parse(jsonString);

    // Zod로 런타임 검증
    return WSClientMessageSchema.parse(parsed);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('[WS] Message validation failed:', error.issues);
    } else if (error instanceof SyntaxError) {
      console.error('[WS] Invalid JSON:', error.message);
    } else {
      console.error('[WS] Parse error:', error);
    }
    return null;
  }
}

/**
 * 클라이언트 메시지 처리
 */
export function handleMessage(ws: WebSocket, data: unknown): void {
  const message = parseClientMessage(data);
  if (!message) {
    sendToClient(ws, {
      type: 'error',
      code: 'INVALID_MESSAGE',
      message: 'Failed to parse message',
      timestamp: Date.now(),
    });
    return;
  }

  const state = getClientState(ws);
  if (!state) {
    console.error('[WS] No state for client');
    return;
  }

  // 메시지 타입별 처리
  switch (message.type) {
    case 'subscribe':
      handleSubscribe(ws, state, message.channel, message.interval);
      break;

    case 'unsubscribe':
      handleUnsubscribe(ws, state, message.channel);
      break;

    case 'container-action':
      handleContainerAction(ws, message.action, message.containerId);
      break;

    case 'ping':
      handlePing(ws, state);
      break;

    default:
      console.warn('[WS] Unknown message type:', (message as { type: string }).type);
  }
}

/**
 * 구독 처리
 */
function handleSubscribe(
  ws: WebSocket,
  state: WSClientState,
  channel: WSChannel,
  _interval?: number
): void {
  state.subscriptions.add(channel);
  console.log(`[WS] Client ${state.id} subscribed to ${channel}`);

  // 구독 즉시 현재 데이터 전송 (클라이언트가 대기 없이 데이터를 받을 수 있도록)
  if (channel === 'metrics') {
    sendCurrentMetrics(ws).catch((err) => {
      console.error('[WS] Failed to send initial metrics:', err);
    });
  }
  // containers 채널은 Phase 11에서 구현 예정
}

/**
 * 구독 해제 처리
 */
function handleUnsubscribe(
  ws: WebSocket,
  state: WSClientState,
  channel: WSChannel
): void {
  state.subscriptions.delete(channel);
  console.log(`[WS] Client ${state.id} unsubscribed from ${channel}`);
}

/**
 * 컨테이너 액션 처리 (stub - Phase 9-02에서 구현)
 */
function handleContainerAction(
  ws: WebSocket,
  action: 'start' | 'stop' | 'restart',
  containerId: string
): void {
  console.log(`[WS] Container action: ${action} on ${containerId}`);

  // TODO: 실제 Docker 액션 실행은 Phase 9-02에서 구현
  sendToClient(ws, {
    type: 'container-ack',
    action,
    containerId,
    success: false,
    message: 'Not implemented yet',
    timestamp: Date.now(),
  });
}

/**
 * Ping 처리 (heartbeat)
 */
function handlePing(ws: WebSocket, state: WSClientState): void {
  state.lastPing = Date.now();
  sendToClient(ws, {
    type: 'heartbeat',
    timestamp: Date.now(),
  });
}

// ============================================================
// 유틸리티
// ============================================================

/**
 * 오래된 연결 정리 (heartbeat timeout)
 * @param timeoutMs 타임아웃 시간 (기본: 30초)
 */
export function cleanupStaleConnections(timeoutMs: number = 30000): number {
  const now = Date.now();
  let removedCount = 0;

  for (const [ws, state] of connectedClients) {
    if (now - state.lastPing > timeoutMs) {
      console.log(`[WS] Cleaning up stale client ${state.id}`);
      ws.close();
      connectedClients.delete(ws);
      removedCount++;
    }
  }

  return removedCount;
}

/**
 * 모든 연결 종료 (서버 종료 시)
 */
export function closeAllConnections(): void {
  for (const [ws, state] of connectedClients) {
    console.log(`[WS] Closing connection for client ${state.id}`);
    ws.close();
  }
  connectedClients.clear();
}

// ============================================================
// 메트릭 브로드캐스트
// ============================================================

/** 메트릭 브로드캐스트 인터벌 ID */
let metricsBroadcastInterval: ReturnType<typeof setInterval> | null = null;

/**
 * SystemMetrics를 WSMetricsData로 변환
 * network, processes, model, platform 필드는 WebSocket에서 제외 (경량화)
 */
function transformToWSMetricsData(metrics: Awaited<ReturnType<typeof getSystemMetrics>>): WSMetricsData {
  return {
    cpu: {
      usage: metrics.cpu.usage,
      cores: metrics.cpu.cores,
      loadAvg: metrics.cpu.loadAvg,
    },
    memory: {
      total: metrics.memory.total,
      used: metrics.memory.used,
      free: metrics.memory.free,
      usage: metrics.memory.usage,
    },
    disk: {
      total: metrics.disk.total,
      used: metrics.disk.used,
      free: metrics.disk.free,
      usage: metrics.disk.usage,
      path: metrics.disk.path,
    },
    uptime: metrics.uptime,
    hostname: metrics.hostname,
  };
}

/**
 * 현재 메트릭을 즉시 전송
 * @param ws 특정 클라이언트에게만 전송 (없으면 전체 채널 브로드캐스트)
 */
export async function sendCurrentMetrics(ws?: WebSocket): Promise<void> {
  try {
    const metrics = await getSystemMetrics();
    const wsMetrics = transformToWSMetricsData(metrics);
    const message: WSServerMessage = {
      type: 'metrics',
      data: wsMetrics,
      timestamp: Date.now(),
    };

    if (ws) {
      sendToClient(ws, message);
    } else {
      broadcastToChannel('metrics', message);
    }
  } catch (error) {
    console.error('[WS] Failed to send metrics:', error);
  }
}

/**
 * 메트릭 브로드캐스트 시작
 * @param intervalMs 브로드캐스트 간격 (밀리초)
 * @returns 정리용 cleanup 함수
 */
export function startMetricsBroadcast(intervalMs: number): () => void {
  // 이미 실행 중이면 기존 인터벌 정리
  if (metricsBroadcastInterval) {
    clearInterval(metricsBroadcastInterval);
  }

  console.log(`[WS] Metrics broadcast started (interval: ${intervalMs}ms)`);

  metricsBroadcastInterval = setInterval(async () => {
    await sendCurrentMetrics();
  }, intervalMs);

  // cleanup 함수 반환
  return () => {
    stopMetricsBroadcast();
  };
}

/**
 * 메트릭 브로드캐스트 중지
 */
export function stopMetricsBroadcast(): void {
  if (metricsBroadcastInterval) {
    clearInterval(metricsBroadcastInterval);
    metricsBroadcastInterval = null;
    console.log('[WS] Metrics broadcast stopped');
  }
}

/**
 * 메트릭 브로드캐스트 실행 여부 확인
 */
export function isMetricsBroadcastRunning(): boolean {
  return metricsBroadcastInterval !== null;
}

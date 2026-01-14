/**
 * WebSocket 메시지 타입 정의 (Zod)
 * WebSocket 통신에서 주고받는 메시지를 런타임에 검증합니다.
 */
import { z } from 'zod';

// ============================================================
// 메시지 타입 열거
// ============================================================

/** 서버 → 클라이언트 메시지 타입 */
export const WSServerMessageType = z.enum([
  'connected',      // 연결 성공 확인
  'metrics',        // 시스템 메트릭 데이터
  'containers',     // 컨테이너 목록 데이터
  'container-ack',  // 컨테이너 액션 응답
  'heartbeat',      // 연결 유지 확인 (pong)
  'error',          // 에러 응답
]);

/** 클라이언트 → 서버 메시지 타입 */
export const WSClientMessageType = z.enum([
  'subscribe',      // 데이터 구독 시작
  'unsubscribe',    // 데이터 구독 해제
  'container-action', // 컨테이너 제어 (start, stop, restart)
  'ping',           // 연결 상태 확인
]);

// ============================================================
// 기본 메시지 스키마
// ============================================================

/** 기본 메시지 구조 (공통) */
export const WSBaseMessageSchema = z.object({
  type: z.string(),
  timestamp: z.number(),
});

// ============================================================
// 클라이언트 → 서버 메시지
// ============================================================

/** 구독 요청 메시지 */
export const WSSubscribeMessageSchema = z.object({
  type: z.literal('subscribe'),
  channel: z.enum(['metrics', 'containers']),
  interval: z.number().min(1000).max(60000).optional(), // ms
  timestamp: z.number(),
});

/** 구독 해제 요청 메시지 */
export const WSUnsubscribeMessageSchema = z.object({
  type: z.literal('unsubscribe'),
  channel: z.enum(['metrics', 'containers']),
  timestamp: z.number(),
});

/** 컨테이너 액션 요청 메시지 */
export const WSContainerActionMessageSchema = z.object({
  type: z.literal('container-action'),
  action: z.enum(['start', 'stop', 'restart']),
  containerId: z.string().min(1),
  timestamp: z.number(),
});

/** Ping 메시지 */
export const WSPingMessageSchema = z.object({
  type: z.literal('ping'),
  timestamp: z.number(),
});

/** 클라이언트 메시지 통합 스키마 */
export const WSClientMessageSchema = z.discriminatedUnion('type', [
  WSSubscribeMessageSchema,
  WSUnsubscribeMessageSchema,
  WSContainerActionMessageSchema,
  WSPingMessageSchema,
]);

// ============================================================
// 서버 → 클라이언트 메시지
// ============================================================

/** 연결 성공 메시지 */
export const WSConnectedMessageSchema = z.object({
  type: z.literal('connected'),
  clientId: z.string(),
  timestamp: z.number(),
});

/** 메트릭 데이터 메시지 */
export const WSMetricsMessageSchema = z.object({
  type: z.literal('metrics'),
  data: z.object({
    cpu: z.number(),
    memory: z.number(),
    disk: z.number(),
    uptime: z.number(),
  }),
  timestamp: z.number(),
});

/** 컨테이너 목록 메시지 */
export const WSContainersMessageSchema = z.object({
  type: z.literal('containers'),
  data: z.array(z.object({
    id: z.string(),
    name: z.string(),
    state: z.string(),
    status: z.string(),
  })),
  timestamp: z.number(),
});

/** 컨테이너 액션 응답 메시지 */
export const WSContainerAckMessageSchema = z.object({
  type: z.literal('container-ack'),
  action: z.enum(['start', 'stop', 'restart']),
  containerId: z.string(),
  success: z.boolean(),
  message: z.string().optional(),
  timestamp: z.number(),
});

/** Heartbeat 응답 메시지 (pong) */
export const WSHeartbeatMessageSchema = z.object({
  type: z.literal('heartbeat'),
  timestamp: z.number(),
});

/** 에러 메시지 */
export const WSErrorMessageSchema = z.object({
  type: z.literal('error'),
  code: z.string(),
  message: z.string(),
  timestamp: z.number(),
});

/** 서버 메시지 통합 스키마 */
export const WSServerMessageSchema = z.discriminatedUnion('type', [
  WSConnectedMessageSchema,
  WSMetricsMessageSchema,
  WSContainersMessageSchema,
  WSContainerAckMessageSchema,
  WSHeartbeatMessageSchema,
  WSErrorMessageSchema,
]);

// ============================================================
// 타입 추출
// ============================================================

export type WSServerMessageType = z.infer<typeof WSServerMessageType>;
export type WSClientMessageType = z.infer<typeof WSClientMessageType>;

export type WSSubscribeMessage = z.infer<typeof WSSubscribeMessageSchema>;
export type WSUnsubscribeMessage = z.infer<typeof WSUnsubscribeMessageSchema>;
export type WSContainerActionMessage = z.infer<typeof WSContainerActionMessageSchema>;
export type WSPingMessage = z.infer<typeof WSPingMessageSchema>;
export type WSClientMessage = z.infer<typeof WSClientMessageSchema>;

export type WSConnectedMessage = z.infer<typeof WSConnectedMessageSchema>;
export type WSMetricsMessage = z.infer<typeof WSMetricsMessageSchema>;
export type WSContainersMessage = z.infer<typeof WSContainersMessageSchema>;
export type WSContainerAckMessage = z.infer<typeof WSContainerAckMessageSchema>;
export type WSHeartbeatMessage = z.infer<typeof WSHeartbeatMessageSchema>;
export type WSErrorMessage = z.infer<typeof WSErrorMessageSchema>;
export type WSServerMessage = z.infer<typeof WSServerMessageSchema>;

// ============================================================
// 헬퍼 타입
// ============================================================

/** 구독 채널 */
export type WSChannel = 'metrics' | 'containers';

/** 클라이언트 구독 상태 */
export interface WSClientState {
  id: string;
  subscriptions: Set<WSChannel>;
  lastPing: number;
}

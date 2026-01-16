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
  'logs',           // 로그 데이터 (Phase 36)
]);

/** 클라이언트 → 서버 메시지 타입 */
export const WSClientMessageType = z.enum([
  'subscribe',        // 데이터 구독 시작
  'unsubscribe',      // 데이터 구독 해제
  'container-action', // 컨테이너 제어 (start, stop, restart)
  'ping',             // 연결 상태 확인
  'subscribe-logs',   // 로그 구독 시작 (Phase 36)
  'unsubscribe-logs', // 로그 구독 해제 (Phase 36)
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

// ============================================================
// 로그 관련 메시지 (Phase 36)
// ============================================================

/** 로그 소스 타입 */
export const WSLogSourceSchema = z.enum(['docker', 'journal', 'app']);

/** 로그 레벨 타입 */
export const WSLogLevelSchema = z.enum([
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
]);

/** 로그 구독 요청 메시지 (클라이언트 → 서버) */
export const WSLogSubscribeMessageSchema = z.object({
  type: z.literal('subscribe-logs'),
  sources: z.array(WSLogSourceSchema).optional(),
  containers: z.array(z.string()).optional(),
  minLevel: WSLogLevelSchema.optional(),
  timestamp: z.number(),
});

/** 로그 구독 해제 메시지 (클라이언트 → 서버) */
export const WSLogUnsubscribeMessageSchema = z.object({
  type: z.literal('unsubscribe-logs'),
  timestamp: z.number(),
});

/** 로그 데이터 항목 스키마 */
export const WSLogEntrySchema = z.object({
  id: z.string(),
  source: WSLogSourceSchema,
  sourceId: z.string(),
  level: z.string(),
  message: z.string(),
  timestamp: z.string(), // ISO string
});

/** 로그 데이터 메시지 (서버 → 클라이언트) */
export const WSLogMessageSchema = z.object({
  type: z.literal('logs'),
  data: z.array(WSLogEntrySchema),
  timestamp: z.number(),
});

/** 클라이언트 메시지 통합 스키마 */
export const WSClientMessageSchema = z.discriminatedUnion('type', [
  WSSubscribeMessageSchema,
  WSUnsubscribeMessageSchema,
  WSContainerActionMessageSchema,
  WSPingMessageSchema,
  WSLogSubscribeMessageSchema,
  WSLogUnsubscribeMessageSchema,
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

/**
 * 확장된 메트릭 데이터 스키마
 * src/lib/system.ts의 SystemMetrics 구조와 일치
 */
export const WSMetricsDataSchema = z.object({
  cpu: z.object({
    usage: z.number(),       // 0-100
    cores: z.number(),
    loadAvg: z.array(z.number()),  // [1min, 5min, 15min]
  }),
  memory: z.object({
    total: z.number(),       // bytes
    used: z.number(),        // bytes
    free: z.number(),        // bytes
    usage: z.number(),       // 0-100
  }),
  disk: z.object({
    total: z.number(),       // bytes
    used: z.number(),        // bytes
    free: z.number(),        // bytes
    usage: z.number(),       // 0-100
    path: z.string(),
  }),
  uptime: z.number(),        // seconds
  hostname: z.string(),
});

/** 메트릭 데이터 메시지 */
export const WSMetricsMessageSchema = z.object({
  type: z.literal('metrics'),
  data: WSMetricsDataSchema,
  timestamp: z.number(),
});

/**
 * 확장된 컨테이너 데이터 스키마
 * ContainerData와 유사한 구조로 확장
 */
export const WSContainersDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
  state: z.string(),
  status: z.string(),
  ports: z.array(z.string()),
  created: z.string(),  // ISO 날짜 문자열
});

/** 컨테이너 목록 메시지 */
export const WSContainersMessageSchema = z.object({
  type: z.literal('containers'),
  data: z.array(WSContainersDataSchema),
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
  WSLogMessageSchema,
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
export type WSLogSubscribeMessage = z.infer<typeof WSLogSubscribeMessageSchema>;
export type WSLogUnsubscribeMessage = z.infer<typeof WSLogUnsubscribeMessageSchema>;
export type WSClientMessage = z.infer<typeof WSClientMessageSchema>;

export type WSConnectedMessage = z.infer<typeof WSConnectedMessageSchema>;
export type WSMetricsData = z.infer<typeof WSMetricsDataSchema>;
export type WSMetricsMessage = z.infer<typeof WSMetricsMessageSchema>;
export type WSContainersData = z.infer<typeof WSContainersDataSchema>;
export type WSContainersMessage = z.infer<typeof WSContainersMessageSchema>;
export type WSContainerAckMessage = z.infer<typeof WSContainerAckMessageSchema>;
export type WSHeartbeatMessage = z.infer<typeof WSHeartbeatMessageSchema>;
export type WSErrorMessage = z.infer<typeof WSErrorMessageSchema>;
export type WSLogEntry = z.infer<typeof WSLogEntrySchema>;
export type WSLogMessage = z.infer<typeof WSLogMessageSchema>;
export type WSLogSource = z.infer<typeof WSLogSourceSchema>;
export type WSLogLevel = z.infer<typeof WSLogLevelSchema>;
export type WSServerMessage = z.infer<typeof WSServerMessageSchema>;

// ============================================================
// 헬퍼 타입
// ============================================================

/** 구독 채널 */
export type WSChannel = 'metrics' | 'containers' | 'logs';

/** 로그 구독 옵션 */
export interface WSLogSubscriptionOptions {
  sources?: WSLogSource[];
  containers?: string[];
  minLevel?: WSLogLevel;
}

/** 클라이언트 구독 상태 */
export interface WSClientState {
  id: string;
  subscriptions: Set<WSChannel>;
  logOptions?: WSLogSubscriptionOptions;
  lastPing: number;
}

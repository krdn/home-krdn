/**
 * WebSocket UPGRADE Route Handler
 * next-ws를 사용한 WebSocket 연결 엔드포인트
 *
 * URL: ws://localhost:3000/api/ws
 */
import { NextResponse } from 'next/server';
import type { WebSocket, WebSocketServer } from 'ws';
import {
  addClient,
  removeClient,
  handleMessage,
  sendToClient,
  getClientState,
  getClientCount,
} from '@/lib/websocket-server';

/**
 * HTTP GET 핸들러 (fallback)
 * WebSocket 연결이 아닌 일반 HTTP 요청 시 상태 정보 반환
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'WebSocket endpoint. Connect using ws:// protocol.',
    connectedClients: getClientCount(),
  });
}

/**
 * WebSocket UPGRADE 핸들러
 * next-ws가 이 함수를 인식하고 WebSocket 연결을 처리합니다.
 */
export function UPGRADE(
  client: WebSocket,
  _server: WebSocketServer
): void {
  // 1. 연결 시 클라이언트 등록
  const clientState = addClient(client);
  console.log('[WS] Client connected:', clientState.id);

  // 2. 연결 성공 메시지 전송
  sendToClient(client, {
    type: 'connected',
    clientId: clientState.id,
    timestamp: Date.now(),
  });

  // 3. 메시지 수신 핸들러
  client.on('message', (data) => {
    handleMessage(client, data);
  });

  // 4. 연결 종료 시 정리
  client.on('close', () => {
    const state = getClientState(client);
    console.log('[WS] Client disconnected:', state?.id ?? 'unknown');
    removeClient(client);
  });

  // 5. 에러 핸들링
  client.on('error', (error) => {
    const state = getClientState(client);
    console.error('[WS] Error for client', state?.id ?? 'unknown', ':', error);
    removeClient(client);
  });
}

'use client';

import { QueryClient } from '@tanstack/react-query';

/**
 * React Query 전역 클라이언트 설정
 *
 * 기본 옵션:
 * - staleTime: 30초 동안 데이터를 fresh로 간주
 * - gcTime: 5분 동안 캐시 유지 (가비지 컬렉션 전)
 * - retry: 실패 시 2번 재시도
 * - refetchOnWindowFocus: 탭 포커스 시 리페치
 * - refetchOnReconnect: 네트워크 재연결 시 리페치
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 30, // 30초 동안 fresh
        gcTime: 1000 * 60 * 5, // 5분 캐시 유지
        retry: 2,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * QueryClient 인스턴스를 가져옵니다.
 * 서버에서는 매번 새로운 인스턴스를, 브라우저에서는 싱글턴을 반환합니다.
 */
export function getQueryClient() {
  if (typeof window === 'undefined') {
    // 서버: 항상 새 인스턴스 생성
    return makeQueryClient();
  } else {
    // 브라우저: 싱글턴 패턴
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

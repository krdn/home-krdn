'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from '@/lib/queryClient';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * 앱 전역 Provider 래퍼 컴포넌트
 *
 * 포함된 Provider:
 * - QueryClientProvider: React Query 캐싱 및 데이터 페칭
 * - ReactQueryDevtools: 개발 환경에서 쿼리 상태 디버깅
 */
export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

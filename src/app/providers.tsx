'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from '@/lib/queryClient';
import { ToastProvider } from '@/components/providers/ToastProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * 앱 전역 Provider 래퍼 컴포넌트
 *
 * 포함된 Provider:
 * - QueryClientProvider: React Query 캐싱 및 데이터 페칭
 * - ToastProvider: Radix Toast 기반 알림 시스템
 * - ReactQueryDevtools: 개발 환경에서 쿼리 상태 디버깅
 */
export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

'use client';

import dynamic from 'next/dynamic';

/**
 * MetricsCharts 컴포넌트를 dynamic import로 로드하는 래퍼
 *
 * 이 컴포넌트는 Client Component로 선언되어 있어 SSR을 비활성화할 수 있습니다.
 * - Recharts 번들 (약 386KB)이 별도 청크로 분리됨
 * - 초기 페이지 로드 성능 개선
 * - 차트는 클라이언트에서만 렌더링
 */
const MetricsCharts = dynamic(
  () =>
    import('@/components/admin/MetricsCharts').then((mod) => ({
      default: mod.MetricsCharts,
    })),
  {
    loading: () => (
      <div className="grid gap-4 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-lg bg-muted"
            aria-label="차트 로딩 중"
          />
        ))}
      </div>
    ),
    ssr: false,
  }
);

/**
 * Lazy-loaded MetricsCharts 래퍼 컴포넌트
 * Server Component에서 사용할 수 있도록 Client Component로 분리
 */
export function LazyMetricsCharts() {
  return <MetricsCharts />;
}

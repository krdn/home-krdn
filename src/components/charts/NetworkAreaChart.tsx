'use client';

import { memo, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';

/**
 * 네트워크 데이터 포인트 타입
 */
export interface NetworkDataPoint {
  /** 표시용 시간 문자열 (HH:mm) */
  time: string;
  /** 전체 타임스탬프 (툴팁용) */
  timestamp: number;
  /** 수신 데이터 (MB) */
  networkRxMB: number;
  /** 송신 데이터 (MB) */
  networkTxMB: number;
}

/**
 * 네트워크 영역 차트 Props
 */
interface NetworkAreaChartProps {
  /** 차트 데이터 배열 */
  data: NetworkDataPoint[];
  /** 차트 제목 */
  title?: string;
}

/**
 * 네트워크 영역 차트 컴포넌트
 * RX/TX 트래픽을 그라디언트 영역 차트로 표시합니다.
 * 다크/라이트 테마와 호환되며 반응형으로 동작합니다.
 *
 * memo()와 커스텀 비교 함수로 불필요한 리렌더링을 방지합니다.
 */
export const NetworkAreaChart = memo(function NetworkAreaChart({
  data,
  title = 'Network I/O',
}: NetworkAreaChartProps) {
  // 동적 Y축 도메인 계산 (메모이제이션)
  const yDomain = useMemo<[number, number]>(() => {
    const maxValue = Math.max(
      ...data.map((d) => Math.max(d.networkRxMB, d.networkTxMB)),
      1 // 최소값 보장
    );
    return [0, Math.ceil(maxValue * 1.2)];
  }, [data]);

  // 차트 마진 메모이제이션
  const chartMargin = useMemo(
    () => ({ top: 5, right: 10, left: 0, bottom: 5 }),
    []
  );

  // 범례 포맷터 메모이제이션
  const legendFormatter = useCallback(
    (value: string) => (
      <span className="text-xs text-muted-foreground">
        {value === 'networkRxMB' ? 'RX (Received)' : 'TX (Sent)'}
      </span>
    ),
    []
  );

  return (
    <div className="h-64 w-full">
      <h3 className="mb-2 text-sm font-medium text-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart
          data={data}
          margin={chartMargin}
        >
          {/* 그라디언트 정의 */}
          <defs>
            {/* RX 그라디언트 - 성공(녹색) 계열 */}
            <linearGradient id="rxGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
            </linearGradient>
            {/* TX 그라디언트 - 정보(파랑) 계열 */}
            <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* 그리드 */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.5}
          />

          {/* X축 - 시간 표시 */}
          <XAxis
            dataKey="time"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={30}
          />

          {/* Y축 - MB 단위 */}
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={yDomain}
            tickFormatter={(value) => `${value} MB`}
            width={55}
          />

          {/* 커스텀 툴팁 */}
          <Tooltip
            content={<ChartTooltip unit=" MB" isNetwork />}
            cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '3 3' }}
          />

          {/* 범례 */}
          <Legend
            verticalAlign="top"
            height={24}
            formatter={legendFormatter}
          />

          {/* RX 영역 */}
          <Area
            type="monotone"
            dataKey="networkRxMB"
            stroke="hsl(var(--success))"
            strokeWidth={2}
            fill="url(#rxGradient)"
            name="networkRxMB"
          />

          {/* TX 영역 */}
          <Area
            type="monotone"
            dataKey="networkTxMB"
            stroke="hsl(var(--info))"
            strokeWidth={2}
            fill="url(#txGradient)"
            name="networkTxMB"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수: 데이터 길이와 마지막 값만 비교 (성능 최적화)
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.data.length !== nextProps.data.length) return false;

  // 마지막 데이터 포인트 비교 (가장 자주 변경되는 부분)
  const prevLast = prevProps.data[prevProps.data.length - 1];
  const nextLast = nextProps.data[nextProps.data.length - 1];
  if (prevLast?.networkRxMB !== nextLast?.networkRxMB) return false;
  if (prevLast?.networkTxMB !== nextLast?.networkTxMB) return false;
  if (prevLast?.timestamp !== nextLast?.timestamp) return false;

  return true;
});

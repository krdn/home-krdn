'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';

/**
 * 메트릭 데이터 포인트 타입
 */
export interface MetricDataPoint {
  /** 표시용 시간 문자열 (HH:mm) */
  time: string;
  /** 전체 타임스탬프 (툴팁용) */
  timestamp: number;
  /** 값 */
  value: number;
}

/**
 * 메트릭 라인 차트 Props
 */
interface MetricsLineChartProps {
  /** 차트 데이터 배열 */
  data: MetricDataPoint[];
  /** 차트 제목 */
  title: string;
  /** 라인 색상 (CSS 변수 또는 색상 값) */
  color?: string;
  /** 값 단위 */
  unit?: string;
  /** Y축 도메인 (기본값: [0, 100]) */
  domain?: [number, number];
}

/**
 * 메트릭 라인 차트 컴포넌트
 * 시간에 따른 단일 메트릭 값을 라인 차트로 표시합니다.
 * 다크/라이트 테마와 호환되며 반응형으로 동작합니다.
 */
export function MetricsLineChart({
  data,
  title,
  color = 'hsl(var(--primary))',
  unit = '%',
  domain = [0, 100],
}: MetricsLineChartProps) {
  return (
    <div className="h-64 w-full">
      <h3 className="mb-2 text-sm font-medium text-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          {/* 그리드 - 테마 호환 */}
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

          {/* Y축 - 값 표시 */}
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={domain}
            tickFormatter={(value) => `${value}${unit}`}
            width={45}
          />

          {/* 커스텀 툴팁 */}
          <Tooltip
            content={<ChartTooltip unit={unit} />}
            cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '3 3' }}
          />

          {/* 데이터 라인 */}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              fill: color,
              stroke: 'hsl(var(--background))',
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

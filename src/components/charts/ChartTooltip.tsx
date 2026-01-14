'use client';

import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

/**
 * 차트 툴팁 Props
 */
interface ChartTooltipProps extends TooltipProps<ValueType, NameType> {
  /** 값 단위 (%, MB, etc.) */
  unit?: string;
  /** 네트워크 차트 모드 (RX/TX 표시) */
  isNetwork?: boolean;
}

/**
 * 시간 포맷팅 함수
 * @param timestamp Unix timestamp (밀리초)
 * @returns HH:mm 형식 문자열
 */
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 바이트 단위 포맷팅 함수
 * @param bytes 바이트 값
 * @returns 포맷된 문자열 (KB, MB, GB)
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 값 표시 이름 매핑
 */
const nameMap: Record<string, string> = {
  value: 'Usage',
  cpu: 'CPU',
  memory: 'Memory',
  disk: 'Disk',
  rx: 'Received',
  tx: 'Sent',
  networkRxMB: 'RX',
  networkTxMB: 'TX',
};

/**
 * 커스텀 차트 툴팁 컴포넌트
 * Recharts와 호환되며 다크/라이트 테마를 지원합니다.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  unit = '%',
  isNetwork = false,
}: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  // 타임스탬프 추출 (payload에서 가져오기)
  const timestamp = payload[0]?.payload?.timestamp;
  const timeStr = timestamp ? formatTime(timestamp) : (typeof label === 'string' ? label : '');

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      {/* 시간 표시 */}
      <p className="mb-1 text-xs text-muted-foreground">{timeStr}</p>

      {/* 값 표시 */}
      {payload.map((entry, index) => {
        const name = entry.dataKey?.toString() || '';
        const displayName = nameMap[name] || name;
        let displayValue: string;

        if (isNetwork && typeof entry.value === 'number') {
          // 네트워크: MB 값을 bytes로 변환하여 포맷
          displayValue = `${entry.value.toFixed(2)} MB`;
        } else if (typeof entry.value === 'number') {
          // 일반 값: 단위 추가
          displayValue = `${entry.value.toFixed(1)}${unit}`;
        } else {
          displayValue = String(entry.value);
        }

        return (
          <p
            key={index}
            className="text-sm font-medium"
            style={{ color: entry.color }}
          >
            {displayName}: {displayValue}
          </p>
        );
      })}
    </div>
  );
}

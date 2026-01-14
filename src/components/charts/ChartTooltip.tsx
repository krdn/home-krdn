'use client';

/**
 * Recharts 툴팁 Payload 타입
 */
interface TooltipPayload {
  value?: number | string;
  dataKey?: string | number;
  color?: string;
  payload?: {
    timestamp?: number;
    [key: string]: unknown;
  };
}

/**
 * 차트 툴팁 Props
 */
interface ChartTooltipProps {
  /** 툴팁 활성화 여부 */
  active?: boolean;
  /** 페이로드 데이터 배열 */
  payload?: TooltipPayload[];
  /** X축 라벨 */
  label?: string | number;
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
  const timeStr = timestamp
    ? formatTime(timestamp)
    : typeof label === 'string'
      ? label
      : '';

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
          // 네트워크: MB 값을 표시
          displayValue = `${entry.value.toFixed(2)} MB`;
        } else if (typeof entry.value === 'number') {
          // 일반 값: 단위 추가
          displayValue = `${entry.value.toFixed(1)}${unit}`;
        } else {
          displayValue = String(entry.value ?? '');
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

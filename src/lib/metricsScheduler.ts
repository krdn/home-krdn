/**
 * Metrics Scheduler
 * 시스템 메트릭을 주기적으로 수집하여 히스토리에 저장합니다.
 */

import { getSystemMetrics } from './system';
import { metricsHistory, type MetricsSnapshot } from './metricsHistory';

// 수집 간격 (밀리초)
const COLLECTION_INTERVAL = 60 * 1000; // 1분

// 스케줄러 상태
let intervalId: NodeJS.Timeout | null = null;
let isCollecting = false;

/**
 * 현재 시스템 메트릭을 수집하여 히스토리에 저장합니다.
 */
async function collectAndStore(): Promise<void> {
  if (isCollecting) {
    return; // 이미 수집 중이면 스킵
  }

  isCollecting = true;

  try {
    const metrics = await getSystemMetrics();

    // 네트워크 트래픽 합계 계산 (lo 제외)
    const networkTotal = metrics.network
      .filter((iface) => iface.name !== 'lo')
      .reduce(
        (acc, iface) => ({
          rx: acc.rx + iface.rxBytes,
          tx: acc.tx + iface.txBytes,
        }),
        { rx: 0, tx: 0 }
      );

    const snapshot: MetricsSnapshot = {
      timestamp: Date.now(),
      cpu: metrics.cpu.usage,
      memory: metrics.memory.usage,
      disk: metrics.disk.usage,
      networkRx: networkTotal.rx,
      networkTx: networkTotal.tx,
    };

    metricsHistory.addSnapshot(snapshot);
  } catch (error) {
    console.error('[MetricsScheduler] Failed to collect metrics:', error);
  } finally {
    isCollecting = false;
  }
}

/**
 * 메트릭 수집을 시작합니다.
 * 이미 실행 중이면 아무 동작도 하지 않습니다.
 */
export function startMetricsCollection(): void {
  if (intervalId !== null) {
    return; // 이미 실행 중
  }

  // 즉시 첫 수집 실행
  collectAndStore();

  // 1분마다 수집
  intervalId = setInterval(collectAndStore, COLLECTION_INTERVAL);

  console.log('[MetricsScheduler] Started metrics collection (interval: 60s)');
}

/**
 * 메트릭 수집을 중지합니다.
 */
export function stopMetricsCollection(): void {
  if (intervalId === null) {
    return; // 실행 중이 아님
  }

  clearInterval(intervalId);
  intervalId = null;

  console.log('[MetricsScheduler] Stopped metrics collection');
}

/**
 * 스케줄러가 실행 중인지 확인합니다.
 */
export function isSchedulerRunning(): boolean {
  return intervalId !== null;
}

/**
 * 수동으로 즉시 메트릭을 수집합니다.
 * 스케줄과 관계없이 바로 수집합니다.
 */
export async function collectNow(): Promise<void> {
  await collectAndStore();
}

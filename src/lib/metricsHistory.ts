/**
 * Metrics History Store
 * 시스템 메트릭 히스토리를 메모리에 저장하고 관리합니다.
 */

/**
 * 메트릭 스냅샷 타입
 * 특정 시점의 주요 시스템 메트릭을 담습니다.
 */
export interface MetricsSnapshot {
  /** Unix timestamp (밀리초) */
  timestamp: number;
  /** CPU 사용률 (0-100) */
  cpu: number;
  /** 메모리 사용률 (0-100) */
  memory: number;
  /** 디스크 사용률 (0-100) */
  disk: number;
  /** 네트워크 수신 바이트 (누적) */
  networkRx: number;
  /** 네트워크 송신 바이트 (누적) */
  networkTx: number;
}

/**
 * 메트릭 히스토리 스토어 옵션
 */
export interface MetricsHistoryOptions {
  /** 최대 스냅샷 수 (기본값: 60) */
  maxSize?: number;
}

/**
 * 메트릭 히스토리 스토어 클래스
 * 싱글톤 패턴으로 구현되어 애플리케이션 전역에서 사용됩니다.
 * 순환 버퍼 방식으로 오래된 데이터를 자동 삭제합니다.
 */
export class MetricsHistoryStore {
  private snapshots: MetricsSnapshot[] = [];
  private readonly maxSize: number;

  constructor(options: MetricsHistoryOptions = {}) {
    this.maxSize = options.maxSize ?? 60; // 기본값: 60개 (1시간, 1분 간격)
  }

  /**
   * 새로운 스냅샷을 추가합니다.
   * maxSize를 초과하면 가장 오래된 스냅샷을 제거합니다.
   * @param snapshot 추가할 메트릭 스냅샷
   */
  addSnapshot(snapshot: MetricsSnapshot): void {
    this.snapshots.push(snapshot);

    // 순환 버퍼: maxSize 초과 시 오래된 것 제거
    while (this.snapshots.length > this.maxSize) {
      this.snapshots.shift();
    }
  }

  /**
   * 히스토리를 조회합니다.
   * @param minutes 조회할 시간 범위 (분). 생략 시 전체 히스토리 반환
   * @returns 시간순 정렬된 스냅샷 배열
   */
  getHistory(minutes?: number): MetricsSnapshot[] {
    if (minutes === undefined || minutes <= 0) {
      return [...this.snapshots];
    }

    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.snapshots.filter((s) => s.timestamp >= cutoff);
  }

  /**
   * 가장 최근 스냅샷을 반환합니다.
   * @returns 최근 스냅샷 또는 null (히스토리가 비어있는 경우)
   */
  getLatest(): MetricsSnapshot | null {
    if (this.snapshots.length === 0) {
      return null;
    }
    return this.snapshots[this.snapshots.length - 1];
  }

  /**
   * 현재 저장된 스냅샷 수를 반환합니다.
   */
  getSize(): number {
    return this.snapshots.length;
  }

  /**
   * 히스토리를 초기화합니다.
   */
  clear(): void {
    this.snapshots = [];
  }
}

// 싱글톤 인스턴스 (기본 설정: 60개 스냅샷)
export const metricsHistory = new MetricsHistoryStore();

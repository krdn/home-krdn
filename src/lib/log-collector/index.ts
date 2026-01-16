/**
 * LogCollectorManager - 로그 수집기 관리자
 *
 * Phase 36-03: Log Aggregation
 * - 여러 로그 수집기를 통합 관리
 * - 로그 구독 및 스트리밍 지원
 * - LogStorage와 연동하여 로그 저장
 */

import { FileLogCollector, type LogCollector } from './file-collector';
import { logStorage, type LogStorage } from '@/lib/log-storage';
import type { LogEntryInput, LogLevel, LogSource } from '@/types/log';
import { isLogLevelAtLeast } from '@/types/log';

// ============================================================
// 타입 정의
// ============================================================

/**
 * 로그 구독 옵션
 */
export interface LogSubscriptionOptions {
  /** 필터링할 소스 목록 (없으면 전체) */
  sources?: LogSource[];

  /** 최소 로그 레벨 (없으면 전체) */
  minLevel?: LogLevel;

  /** 필터링할 컨테이너 ID 목록 (docker 소스 전용) */
  containers?: string[];
}

/**
 * 로그 구독 핸들러
 */
export type LogSubscriptionHandler = (entry: LogEntryInput) => void;

/**
 * 구독 정보
 */
interface Subscription {
  id: string;
  handler: LogSubscriptionHandler;
  options: LogSubscriptionOptions;
}

// ============================================================
// LogCollectorManager 구현
// ============================================================

/**
 * 로그 수집기 관리자
 *
 * 여러 소스(파일, Docker, Journal)의 로그 수집기를 통합 관리하고,
 * 구독자에게 필터링된 로그를 전달합니다.
 *
 * @example
 * ```typescript
 * const manager = new LogCollectorManager(logStorage);
 *
 * // 파일 로그 수집 시작
 * await manager.startFileCollector('/var/log/app.log');
 *
 * // 로그 구독
 * const subId = manager.subscribe(
 *   (entry) => console.log(entry),
 *   { sources: ['app'], minLevel: 'warn' }
 * );
 *
 * // 구독 해제
 * manager.unsubscribe(subId);
 * ```
 */
export class LogCollectorManager {
  /** 활성 수집기 맵 (key: 수집기 ID) */
  private collectors = new Map<string, LogCollector>();

  /** 로그 구독 목록 */
  private subscriptions: Subscription[] = [];

  /** 다음 구독 ID */
  private nextSubId = 1;

  /** 로그 저장소 */
  private storage: LogStorage;

  /** 배치 저장을 위한 버퍼 */
  private logBuffer: LogEntryInput[] = [];

  /** 버퍼 플러시 타이머 */
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  /** 버퍼 플러시 간격 (ms) */
  private readonly flushIntervalMs = 1000;

  /** 버퍼 최대 크기 */
  private readonly maxBufferSize = 100;

  /**
   * LogCollectorManager 생성자
   *
   * @param storage 로그 저장소 (기본값: 전역 logStorage)
   */
  constructor(storage: LogStorage = logStorage) {
    this.storage = storage;
    this.startFlushTimer();
  }

  /**
   * 파일 로그 수집기 시작
   *
   * 지정된 파일을 모니터링하는 수집기를 시작합니다.
   *
   * @param filePath 모니터링할 로그 파일 경로
   */
  async startFileCollector(filePath: string): Promise<void> {
    const collectorId = `file:${filePath}`;

    // 이미 존재하는 수집기는 건너뜀
    if (this.collectors.has(collectorId)) {
      console.log(`[LogCollector] File collector already exists: ${filePath}`);
      return;
    }

    const collector = new FileLogCollector(filePath);

    // 로그 이벤트 핸들러
    collector.on('log', (entry) => {
      this.handleLog(entry);
    });

    // 에러 이벤트 핸들러
    collector.on('error', (err) => {
      console.error(`[LogCollector] File collector error (${filePath}):`, err);
    });

    await collector.start();
    this.collectors.set(collectorId, collector);

    console.log(`[LogCollector] File collector started: ${filePath}`);
  }

  /**
   * 수집기 중지
   *
   * @param collectorId 중지할 수집기 ID
   */
  stopCollector(collectorId: string): void {
    const collector = this.collectors.get(collectorId);
    if (collector) {
      collector.stop();
      this.collectors.delete(collectorId);
      console.log(`[LogCollector] Collector stopped: ${collectorId}`);
    }
  }

  /**
   * 모든 수집기 중지
   */
  stopAll(): void {
    for (const [id, collector] of this.collectors) {
      collector.stop();
      console.log(`[LogCollector] Collector stopped: ${id}`);
    }
    this.collectors.clear();

    // 플러시 타이머 정리
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // 남은 버퍼 플러시
    this.flushBuffer();
  }

  /**
   * 로그 구독
   *
   * 필터링 조건에 맞는 로그를 실시간으로 받습니다.
   *
   * @param handler 로그 수신 핸들러
   * @param options 구독 옵션 (필터링 조건)
   * @returns 구독 ID (해제 시 사용)
   */
  subscribe(
    handler: LogSubscriptionHandler,
    options: LogSubscriptionOptions = {}
  ): string {
    const id = `sub-${this.nextSubId++}`;
    this.subscriptions.push({ id, handler, options });
    console.log(`[LogCollector] Subscription added: ${id}`);
    return id;
  }

  /**
   * 로그 구독 해제
   *
   * @param subscriptionId 해제할 구독 ID
   */
  unsubscribe(subscriptionId: string): void {
    const index = this.subscriptions.findIndex((s) => s.id === subscriptionId);
    if (index !== -1) {
      this.subscriptions.splice(index, 1);
      console.log(`[LogCollector] Subscription removed: ${subscriptionId}`);
    }
  }

  /**
   * 활성 수집기 목록 조회
   *
   * @returns 수집기 ID 배열
   */
  getActiveCollectors(): string[] {
    return Array.from(this.collectors.keys());
  }

  /**
   * 활성 구독 수
   */
  get subscriptionCount(): number {
    return this.subscriptions.length;
  }

  /**
   * 로그 처리 (내부 메서드)
   *
   * 수신된 로그를 저장소에 버퍼링하고 구독자에게 전달합니다.
   */
  private handleLog(entry: LogEntryInput): void {
    // 저장소에 버퍼링
    this.logBuffer.push(entry);

    // 버퍼가 가득 차면 즉시 플러시
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flushBuffer();
    }

    // 구독자에게 전달
    this.notifySubscribers(entry);
  }

  /**
   * 구독자에게 로그 전달
   */
  private notifySubscribers(entry: LogEntryInput): void {
    for (const sub of this.subscriptions) {
      if (this.matchesFilter(entry, sub.options)) {
        try {
          sub.handler(entry);
        } catch (err) {
          console.error(
            `[LogCollector] Subscription handler error (${sub.id}):`,
            err
          );
        }
      }
    }
  }

  /**
   * 필터 조건 확인
   */
  private matchesFilter(
    entry: LogEntryInput,
    options: LogSubscriptionOptions
  ): boolean {
    // 소스 필터
    if (options.sources && options.sources.length > 0) {
      if (!options.sources.includes(entry.source)) {
        return false;
      }
    }

    // 레벨 필터
    if (options.minLevel) {
      if (!isLogLevelAtLeast(entry.level, options.minLevel)) {
        return false;
      }
    }

    // 컨테이너 필터 (docker 소스 전용)
    if (options.containers && options.containers.length > 0) {
      if (entry.source === 'docker') {
        if (!options.containers.includes(entry.sourceId)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 플러시 타이머 시작
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushBuffer();
    }, this.flushIntervalMs);
  }

  /**
   * 버퍼 플러시 (저장소에 배치 저장)
   */
  private flushBuffer(): void {
    if (this.logBuffer.length === 0) {
      return;
    }

    const entries = [...this.logBuffer];
    this.logBuffer = [];

    // 비동기 배치 저장 (에러 무시)
    this.storage.writeBatch(entries).catch((err) => {
      console.error('[LogCollector] Failed to flush log buffer:', err);
    });
  }
}

// ============================================================
// 싱글톤 인스턴스
// ============================================================

/**
 * 전역 LogCollectorManager 인스턴스
 */
export const logCollectorManager = new LogCollectorManager();

export { FileLogCollector } from './file-collector';
export type { LogCollector } from './file-collector';
export default logCollectorManager;

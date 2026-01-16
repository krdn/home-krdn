/**
 * FileLogCollector - 파일 기반 로그 수집기
 *
 * Phase 36-03: Log Aggregation
 * - Pino JSON 로그 파일을 실시간으로 모니터링
 * - node-tail 라이브러리를 사용하여 파일 변경 감지
 * - Log rotation 시 자동 재연결
 */

import { Tail } from 'tail';
import type { LogEntry, LogLevel, LogEntryInput } from '@/types/log';

// ============================================================
// LogCollector 인터페이스 정의
// ============================================================

/**
 * 로그 수집기 인터페이스
 * 모든 로그 수집기가 구현해야 할 공통 인터페이스
 */
export interface LogCollector {
  /** 로그 소스 타입 */
  readonly source: 'docker' | 'journal' | 'app';

  /** 수집 시작 */
  start(): Promise<void>;

  /** 수집 중지 */
  stop(): void;

  /** 이벤트 핸들러 등록 */
  on(event: 'log', handler: (entry: LogEntryInput) => void): void;
  on(event: 'error', handler: (error: Error) => void): void;
}

// ============================================================
// FileLogCollector 구현
// ============================================================

/**
 * 파일 기반 로그 수집기
 *
 * Pino JSON 형식의 로그 파일을 실시간으로 모니터링하고
 * 새로운 로그 라인이 추가될 때마다 이벤트를 발생시킵니다.
 *
 * @example
 * ```typescript
 * const collector = new FileLogCollector('/var/log/app.log');
 * collector.on('log', (entry) => console.log(entry));
 * await collector.start();
 * ```
 */
export class FileLogCollector implements LogCollector {
  /** 로그 소스 타입 (항상 'app') */
  readonly source = 'app' as const;

  /** 모니터링할 파일 경로 */
  private filePath: string;

  /** Tail 인스턴스 */
  private tail: Tail | null = null;

  /** 이벤트 핸들러 저장소 */
  private handlers: {
    log: ((entry: LogEntryInput) => void)[];
    error: ((error: Error) => void)[];
  } = {
    log: [],
    error: [],
  };

  /** 수집기 활성화 상태 */
  private _isRunning = false;

  /**
   * FileLogCollector 생성자
   *
   * @param filePath 모니터링할 로그 파일 경로
   */
  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * 수집기 활성화 상태
   */
  get isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * 로그 수집 시작
   *
   * 지정된 파일을 모니터링하기 시작합니다.
   * 파일이 존재하지 않으면 에러를 발생시킵니다.
   */
  async start(): Promise<void> {
    if (this._isRunning) {
      return;
    }

    this.tail = new Tail(this.filePath, {
      follow: true, // log rotation 시 자동 재연결
      fromBeginning: false, // 기존 로그 건너뜀
      useWatchFile: true, // polling 방식 (NFS 호환)
    });

    // 새 로그 라인 수신 핸들러
    this.tail.on('line', (line: string) => {
      const entry = this.parsePinoLog(line);
      if (entry) {
        this.handlers.log.forEach((h) => h(entry));
      }
    });

    // 에러 핸들러
    this.tail.on('error', (err: Error) => {
      this.handlers.error.forEach((h) => h(err));
    });

    this._isRunning = true;
  }

  /**
   * 로그 수집 중지
   */
  stop(): void {
    if (this.tail) {
      this.tail.unwatch();
      this.tail = null;
    }
    this._isRunning = false;
  }

  /**
   * 이벤트 핸들러 등록
   *
   * @param event 이벤트 타입 ('log' | 'error')
   * @param handler 핸들러 함수
   */
  on(event: 'log', handler: (entry: LogEntryInput) => void): void;
  on(event: 'error', handler: (error: Error) => void): void;
  on(
    event: 'log' | 'error',
    handler: ((entry: LogEntryInput) => void) | ((error: Error) => void)
  ): void {
    if (event === 'log') {
      this.handlers.log.push(handler as (entry: LogEntryInput) => void);
    } else if (event === 'error') {
      this.handlers.error.push(handler as (error: Error) => void);
    }
  }

  /**
   * 이벤트 핸들러 제거
   *
   * @param event 이벤트 타입
   * @param handler 제거할 핸들러 함수
   */
  off(event: 'log', handler: (entry: LogEntryInput) => void): void;
  off(event: 'error', handler: (error: Error) => void): void;
  off(
    event: 'log' | 'error',
    handler: ((entry: LogEntryInput) => void) | ((error: Error) => void)
  ): void {
    if (event === 'log') {
      this.handlers.log = this.handlers.log.filter((h) => h !== handler);
    } else if (event === 'error') {
      this.handlers.error = this.handlers.error.filter((h) => h !== handler);
    }
  }

  /**
   * Pino JSON 로그 파싱
   *
   * Pino 로거가 출력하는 JSON 형식의 로그를 파싱합니다.
   * JSON이 아닌 라인은 plain text로 처리합니다.
   *
   * @param line 로그 라인 문자열
   * @returns 파싱된 LogEntryInput 또는 null
   */
  private parsePinoLog(line: string): LogEntryInput | null {
    // 빈 라인 무시
    if (!line.trim()) {
      return null;
    }

    try {
      const log = JSON.parse(line);
      return {
        source: 'app',
        sourceId: log.module || log.name || this.filePath,
        level: this.mapPinoLevel(log.level),
        message: log.msg || log.message || line,
        timestamp: log.time ? new Date(log.time) : new Date(),
        metadata: this.extractMetadata(log),
      };
    } catch {
      // JSON이 아닌 라인은 plain text로 처리
      return {
        source: 'app',
        sourceId: this.filePath,
        level: 'info',
        message: line,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Pino 레벨 숫자를 LogLevel로 매핑
   *
   * Pino 레벨 숫자:
   * - 10: trace
   * - 20: debug
   * - 30: info
   * - 40: warn
   * - 50: error
   * - 60: fatal
   *
   * @param level Pino 레벨 (숫자 또는 문자열)
   * @returns LogLevel
   */
  private mapPinoLevel(level: number | string): LogLevel {
    if (typeof level === 'string') {
      // 문자열 레벨 검증
      const validLevels: LogLevel[] = [
        'trace',
        'debug',
        'info',
        'warn',
        'error',
        'fatal',
      ];
      if (validLevels.includes(level as LogLevel)) {
        return level as LogLevel;
      }
      return 'info';
    }

    // 숫자 레벨 매핑
    if (level <= 10) return 'trace';
    if (level <= 20) return 'debug';
    if (level <= 30) return 'info';
    if (level <= 40) return 'warn';
    if (level <= 50) return 'error';
    return 'fatal';
  }

  /**
   * Pino 로그에서 메타데이터 추출
   *
   * 표준 Pino 필드(level, time, msg 등)를 제외한
   * 나머지 필드를 메타데이터로 반환합니다.
   *
   * @param log 파싱된 Pino 로그 객체
   * @returns 메타데이터 객체
   */
  private extractMetadata(
    log: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    // 제외할 표준 Pino 필드
    const excludeFields = [
      'level',
      'time',
      'msg',
      'message',
      'pid',
      'hostname',
      'name',
      'module',
    ];

    const metadata: Record<string, unknown> = {};
    let hasMetadata = false;

    for (const [key, value] of Object.entries(log)) {
      if (!excludeFields.includes(key)) {
        metadata[key] = value;
        hasMetadata = true;
      }
    }

    return hasMetadata ? metadata : undefined;
  }
}

export default FileLogCollector;

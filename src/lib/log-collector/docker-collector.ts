/**
 * Docker Log Collector
 * Docker 컨테이너에서 실시간 로그를 스트리밍 수집합니다.
 *
 * Phase 36: Log Aggregation
 * - Docker socket API를 통한 로그 스트리밍 (follow=true)
 * - 8바이트 헤더 파싱 (stdout/stderr 분리)
 * - 타임스탬프 파싱 (ISO 형식)
 * - EventEmitter 패턴으로 로그 이벤트 전달
 */

import http from 'http'
import type { LogSource, LogLevel, LogEntryInput } from '@/types/log'

// ============================================================
// 상수 및 타입 정의
// ============================================================

/** Docker socket 경로 (환경변수 또는 기본값) */
const DOCKER_SOCKET = process.env.DOCKER_HOST || '/var/run/docker.sock'

/**
 * 로그 수집기 인터페이스
 * 모든 로그 수집기가 구현해야 하는 공통 인터페이스
 */
export interface LogCollector {
  /** 로그 소스 타입 */
  source: LogSource

  /** 수집 시작 */
  start(): Promise<void>

  /** 수집 중지 */
  stop(): void

  /** 로그 이벤트 핸들러 등록 */
  on(event: 'log', handler: (entry: LogEntryInput) => void): void
  on(event: 'error', handler: (error: Error) => void): void
}

/**
 * Docker 로그 스트림 타입
 */
type DockerStream = 'stdout' | 'stderr'

/**
 * 파싱된 Docker 로그 엔트리
 */
interface ParsedDockerLog {
  stream: DockerStream
  message: string
  timestamp?: Date
}

// ============================================================
// Docker 로그 파싱 함수
// ============================================================

/**
 * Docker 로그 스트림을 파싱합니다.
 *
 * Docker API는 로그를 8바이트 헤더와 함께 전송합니다:
 * - byte 0: stream type (0=stdin, 1=stdout, 2=stderr)
 * - byte 1-3: reserved (0)
 * - byte 4-7: message size (Big Endian)
 * - byte 8+: message content
 *
 * timestamps=true 옵션 사용 시 메시지 앞에 ISO 타임스탬프 포함
 *
 * @param buffer Docker 로그 청크
 * @returns 파싱된 로그 엔트리 배열
 */
function parseDockerLogStream(buffer: Buffer): ParsedDockerLog[] {
  const entries: ParsedDockerLog[] = []
  let offset = 0

  while (offset < buffer.length) {
    // 최소 8바이트 헤더 필요
    if (offset + 8 > buffer.length) break

    // stream type: 1=stdout, 2=stderr
    const streamType = buffer[offset]
    // message size (Big Endian, bytes 4-7)
    const size = buffer.readUInt32BE(offset + 4)
    offset += 8

    // 메시지 크기만큼 읽기
    if (offset + size > buffer.length) break

    const content = buffer.toString('utf8', offset, offset + size).trim()
    offset += size

    // timestamps=true 옵션 사용 시 ISO 형식 타임스탬프 파싱
    // 형식: 2026-01-16T12:34:56.789012345Z message content
    const timestampMatch = content.match(
      /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)\s+([\s\S]*)$/
    )

    entries.push({
      stream: streamType === 2 ? 'stderr' : 'stdout',
      message: timestampMatch ? timestampMatch[2] : content,
      timestamp: timestampMatch ? new Date(timestampMatch[1]) : undefined,
    })
  }

  return entries
}

/**
 * Docker 스트림 타입을 로그 레벨로 매핑합니다.
 *
 * - stdout: info (일반 출력)
 * - stderr: warn (에러 출력, 실제 에러인지는 메시지 내용에 따름)
 *
 * @param stream Docker 스트림 타입
 * @param message 로그 메시지 (에러 키워드 감지용)
 * @returns 로그 레벨
 */
function mapStreamToLevel(stream: DockerStream, message: string): LogLevel {
  // stderr이면서 error/fatal 키워드 포함 시 error
  if (stream === 'stderr') {
    const lower = message.toLowerCase()
    if (lower.includes('fatal') || lower.includes('panic')) {
      return 'fatal'
    }
    if (lower.includes('error') || lower.includes('exception')) {
      return 'error'
    }
    return 'warn'
  }

  // stdout에서도 로그 레벨 키워드 감지
  const lower = message.toLowerCase()
  if (lower.includes('[debug]') || lower.includes('debug:')) {
    return 'debug'
  }
  if (lower.includes('[warn]') || lower.includes('warning:')) {
    return 'warn'
  }
  if (lower.includes('[error]') || lower.includes('error:')) {
    return 'error'
  }

  return 'info'
}

// ============================================================
// DockerLogCollector 클래스
// ============================================================

/**
 * Docker 컨테이너 로그 수집기
 *
 * Docker socket API를 통해 컨테이너 로그를 실시간으로 스트리밍합니다.
 * follow=true 옵션으로 새로운 로그가 발생하면 즉시 수신합니다.
 *
 * @example
 * ```typescript
 * const collector = new DockerLogCollector('abc123', 'my-container');
 *
 * collector.on('log', (entry) => {
 *   console.log(entry.message);
 * });
 *
 * collector.on('error', (err) => {
 *   console.error('Collector error:', err);
 * });
 *
 * await collector.start();
 *
 * // 나중에 정리
 * collector.stop();
 * ```
 */
export class DockerLogCollector implements LogCollector {
  readonly source: LogSource = 'docker'

  /** 컨테이너 ID */
  private readonly containerId: string

  /** 컨테이너 이름 (sourceId로 사용) */
  private readonly containerName: string

  /** HTTP 요청 인스턴스 (정리용) */
  private request: http.ClientRequest | null = null

  /** 이벤트 핸들러 */
  private handlers: {
    log: Array<(entry: LogEntryInput) => void>
    error: Array<(error: Error) => void>
  } = { log: [], error: [] }

  /** 초기 로그 수 (tail) */
  private readonly tailLines: number

  /** 수집 시작 여부 */
  private isRunning = false

  /**
   * DockerLogCollector 생성자
   *
   * @param containerId Docker 컨테이너 ID
   * @param containerName 컨테이너 이름 (로그 식별용)
   * @param tailLines 초기 로드할 로그 줄 수 (기본값: 100)
   */
  constructor(
    containerId: string,
    containerName: string,
    tailLines: number = 100
  ) {
    this.containerId = containerId
    this.containerName = containerName
    this.tailLines = tailLines
  }

  /**
   * 이벤트 핸들러 등록
   *
   * @param event 이벤트 이름 ('log' 또는 'error')
   * @param handler 이벤트 핸들러 함수
   */
  on(event: 'log', handler: (entry: LogEntryInput) => void): void
  on(event: 'error', handler: (error: Error) => void): void
  on(
    event: 'log' | 'error',
    handler: ((entry: LogEntryInput) => void) | ((error: Error) => void)
  ): void {
    if (event === 'log') {
      this.handlers.log.push(handler as (entry: LogEntryInput) => void)
    } else {
      this.handlers.error.push(handler as (error: Error) => void)
    }
  }

  /**
   * 로그 이벤트 emit
   */
  private emitLog(entry: LogEntryInput): void {
    for (const handler of this.handlers.log) {
      try {
        handler(entry)
      } catch (err) {
        console.error('Log handler error:', err)
      }
    }
  }

  /**
   * 에러 이벤트 emit
   */
  private emitError(error: Error): void {
    for (const handler of this.handlers.error) {
      try {
        handler(error)
      } catch (err) {
        console.error('Error handler error:', err)
      }
    }
  }

  /**
   * 로그 수집 시작
   *
   * Docker socket API에 연결하여 로그 스트리밍을 시작합니다.
   * follow=true 옵션으로 실시간 로그를 수신합니다.
   *
   * @throws 이미 실행 중인 경우 에러
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error(`Collector for ${this.containerName} is already running`)
    }

    return new Promise((resolve, reject) => {
      const path =
        `/containers/${this.containerId}/logs` +
        `?stdout=true&stderr=true&follow=true&timestamps=true&tail=${this.tailLines}`

      const options: http.RequestOptions = {
        socketPath: DOCKER_SOCKET,
        path,
        method: 'GET',
      }

      this.request = http.request(options, (res) => {
        // 응답 코드 확인
        if (res.statusCode !== 200) {
          const error = new Error(
            `Docker log stream failed: ${res.statusCode} ${res.statusMessage}`
          )
          this.emitError(error)
          reject(error)
          return
        }

        this.isRunning = true
        resolve()

        // 데이터 수신 처리
        res.on('data', (chunk: Buffer) => {
          try {
            const logs = parseDockerLogStream(chunk)

            for (const log of logs) {
              const entry: LogEntryInput = {
                source: 'docker',
                sourceId: this.containerName,
                level: mapStreamToLevel(log.stream, log.message),
                message: log.message,
                timestamp: log.timestamp,
                metadata: {
                  containerId: this.containerId,
                  stream: log.stream,
                },
              }

              this.emitLog(entry)
            }
          } catch (err) {
            this.emitError(
              err instanceof Error ? err : new Error(String(err))
            )
          }
        })

        // 스트림 종료 (컨테이너 종료 등)
        res.on('end', () => {
          this.isRunning = false
        })

        // 스트림 에러
        res.on('error', (err) => {
          this.isRunning = false
          this.emitError(err)
        })
      })

      // 요청 에러
      this.request.on('error', (err) => {
        this.isRunning = false
        this.emitError(err)
        reject(err)
      })

      this.request.end()
    })
  }

  /**
   * 로그 수집 중지
   *
   * 실행 중인 HTTP 요청을 종료하여 스트림을 정리합니다.
   * 메모리 누수 방지를 위해 반드시 호출해야 합니다.
   */
  stop(): void {
    if (this.request) {
      this.request.destroy()
      this.request = null
    }
    this.isRunning = false
  }

  /**
   * 수집 중인지 확인
   */
  get running(): boolean {
    return this.isRunning
  }

  /**
   * 컨테이너 이름 반환
   */
  get name(): string {
    return this.containerName
  }

  /**
   * 컨테이너 ID 반환
   */
  get id(): string {
    return this.containerId
  }
}

export default DockerLogCollector

/**
 * Log Storage Service
 * 로그 저장소 서비스 레이어
 *
 * Phase 36: Log Aggregation
 * - Prisma LogEntry 모델 기반 CRUD
 * - 배치 저장 지원 (성능 최적화)
 * - 로그 조회 필터링/페이지네이션
 * - 로그 보존 정책 (retention)
 * - 통계 조회
 */

import type { PrismaClient, LogEntry as PrismaLogEntry } from '@prisma/client'
import prisma from '@/lib/prisma'
import type {
  LogEntry,
  LogEntryInput,
  LogQuery,
  LogQueryResult,
  LogStats,
  LogSource,
  LogLevel,
} from '@/types/log'

// ============================================================
// 타입 변환 헬퍼
// ============================================================

/**
 * Prisma LogEntry를 API LogEntry로 변환
 */
function toLogEntry(entry: PrismaLogEntry): LogEntry {
  return {
    id: entry.id,
    source: entry.source as LogSource,
    sourceId: entry.sourceId,
    level: entry.level as LogLevel,
    message: entry.message,
    timestamp: entry.timestamp,
    metadata: entry.metadata ? JSON.parse(entry.metadata) : undefined,
  }
}

/**
 * LogEntryInput을 Prisma create data로 변환
 */
function toCreateData(input: LogEntryInput): {
  source: string
  sourceId: string
  level: string
  message: string
  timestamp: Date
  metadata: string | null
} {
  return {
    source: input.source,
    sourceId: input.sourceId,
    level: input.level,
    message: input.message,
    timestamp: input.timestamp ?? new Date(),
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  }
}

// ============================================================
// LogStorage 클래스
// ============================================================

/**
 * 로그 저장소 서비스
 *
 * 로그의 저장, 조회, 삭제, 통계 기능을 제공합니다.
 * Prisma를 통해 데이터베이스와 상호작용합니다.
 */
export class LogStorage {
  constructor(private prisma: PrismaClient) {}

  /**
   * 단일 로그 저장
   *
   * @param entry 로그 엔트리 입력 (id, timestamp 자동 생성)
   * @returns 저장된 로그 엔트리
   */
  async write(entry: LogEntryInput): Promise<LogEntry> {
    const created = await this.prisma.logEntry.create({
      data: toCreateData(entry),
    })
    return toLogEntry(created)
  }

  /**
   * 배치 로그 저장 (성능 최적화)
   *
   * 여러 로그를 한 번에 저장합니다.
   * 트랜잭션 내에서 처리되어 원자성을 보장합니다.
   *
   * @param entries 로그 엔트리 배열
   * @returns 저장된 로그 개수
   */
  async writeBatch(entries: LogEntryInput[]): Promise<number> {
    if (entries.length === 0) {
      return 0
    }

    const result = await this.prisma.logEntry.createMany({
      data: entries.map(toCreateData),
    })

    return result.count
  }

  /**
   * 로그 조회 (필터링, 페이지네이션)
   *
   * 다양한 조건으로 로그를 조회합니다.
   * 시간순 내림차순 정렬 (최신 로그가 먼저)
   *
   * @param params 조회 파라미터
   * @returns 로그 목록과 전체 개수
   */
  async query(params: LogQuery): Promise<LogQueryResult> {
    // WHERE 조건 구성
    const where: {
      source?: { in: string[] }
      level?: { in: string[] }
      sourceId?: string
      message?: { contains: string }
      timestamp?: { gte?: Date; lte?: Date }
    } = {}

    // 소스 필터
    if (params.sources && params.sources.length > 0) {
      where.source = { in: params.sources }
    }

    // 레벨 필터
    if (params.levels && params.levels.length > 0) {
      where.level = { in: params.levels }
    }

    // 소스 ID 필터 (특정 컨테이너/유닛)
    if (params.sourceId) {
      where.sourceId = params.sourceId
    }

    // 메시지 검색
    if (params.search) {
      where.message = { contains: params.search }
    }

    // 시간 범위 필터
    if (params.startTime || params.endTime) {
      where.timestamp = {}
      if (params.startTime) {
        where.timestamp.gte = params.startTime
      }
      if (params.endTime) {
        where.timestamp.lte = params.endTime
      }
    }

    // 병렬 실행: 로그 조회 + 전체 개수
    const [logs, total] = await Promise.all([
      this.prisma.logEntry.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: params.limit,
        skip: params.offset,
      }),
      this.prisma.logEntry.count({ where }),
    ])

    return {
      logs: logs.map(toLogEntry),
      total,
      limit: params.limit,
      offset: params.offset,
    }
  }

  /**
   * ID로 로그 조회
   *
   * @param id 로그 ID
   * @returns 로그 엔트리 또는 null
   */
  async findById(id: string): Promise<LogEntry | null> {
    const entry = await this.prisma.logEntry.findUnique({
      where: { id },
    })
    return entry ? toLogEntry(entry) : null
  }

  /**
   * 보존 기간 지난 로그 정리 (retention)
   *
   * 지정된 기간보다 오래된 로그를 삭제합니다.
   *
   * @param retentionDays 보존 일수 (기본값: 7일)
   * @returns 삭제된 로그 개수
   */
  async cleanup(retentionDays: number = 7): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const result = await this.prisma.logEntry.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    })

    return result.count
  }

  /**
   * 특정 소스의 로그 삭제
   *
   * @param source 로그 소스 (docker, journal, app)
   * @param sourceId 소스 ID (선택)
   * @returns 삭제된 로그 개수
   */
  async deleteBySource(source: LogSource, sourceId?: string): Promise<number> {
    const where: { source: string; sourceId?: string } = { source }
    if (sourceId) {
      where.sourceId = sourceId
    }

    const result = await this.prisma.logEntry.deleteMany({ where })
    return result.count
  }

  /**
   * 로그 통계 조회
   *
   * 소스별, 레벨별 로그 개수를 반환합니다.
   *
   * @returns 로그 통계
   */
  async getStats(): Promise<LogStats> {
    // 소스별 통계
    const bySourceRaw = await this.prisma.logEntry.groupBy({
      by: ['source'],
      _count: { source: true },
    })

    // 레벨별 통계
    const byLevelRaw = await this.prisma.logEntry.groupBy({
      by: ['level'],
      _count: { level: true },
    })

    // 전체 개수
    const total = await this.prisma.logEntry.count()

    return {
      bySource: bySourceRaw.map((item) => ({
        key: item.source,
        count: item._count.source,
      })),
      byLevel: byLevelRaw.map((item) => ({
        key: item.level,
        count: item._count.level,
      })),
      total,
    }
  }

  /**
   * 최근 로그 조회 (간편 메서드)
   *
   * @param limit 조회 개수 (기본값: 100)
   * @returns 최근 로그 목록
   */
  async getRecent(limit: number = 100): Promise<LogEntry[]> {
    const logs = await this.prisma.logEntry.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    })
    return logs.map(toLogEntry)
  }

  /**
   * 레벨별 최근 로그 조회
   *
   * @param level 로그 레벨
   * @param limit 조회 개수 (기본값: 50)
   * @returns 해당 레벨의 최근 로그 목록
   */
  async getByLevel(level: LogLevel, limit: number = 50): Promise<LogEntry[]> {
    const logs = await this.prisma.logEntry.findMany({
      where: { level },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })
    return logs.map(toLogEntry)
  }

  /**
   * 에러 로그 조회 (error + fatal)
   *
   * @param limit 조회 개수 (기본값: 50)
   * @returns 에러 로그 목록
   */
  async getErrors(limit: number = 50): Promise<LogEntry[]> {
    const logs = await this.prisma.logEntry.findMany({
      where: {
        level: { in: ['error', 'fatal'] },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })
    return logs.map(toLogEntry)
  }
}

// ============================================================
// 싱글톤 인스턴스
// ============================================================

/**
 * 기본 LogStorage 인스턴스
 *
 * 애플리케이션 전역에서 사용할 로그 저장소입니다.
 */
export const logStorage = new LogStorage(prisma)

export default logStorage

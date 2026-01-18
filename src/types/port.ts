/**
 * Port Registry 타입 정의
 * Phase 33: Port Registry System
 *
 * 포트 레지스트리 관련 타입과 Zod 검증 스키마를 정의합니다.
 */

import { z } from 'zod/v4'

// ============================================================
// 상수 정의
// ============================================================

/**
 * 포트 프로토콜 종류
 */
export const PORT_PROTOCOLS = ['tcp', 'udp'] as const
export type PortProtocol = (typeof PORT_PROTOCOLS)[number]

/**
 * 환경 종류
 */
export const PORT_ENVIRONMENTS = ['development', 'staging', 'production'] as const
export type PortEnvironment = (typeof PORT_ENVIRONMENTS)[number]

/**
 * 포트 상태
 */
export const PORT_STATUSES = ['active', 'reserved', 'deprecated'] as const
export type PortStatus = (typeof PORT_STATUSES)[number]

/**
 * 포트 카테고리
 */
export const PORT_CATEGORIES = ['ai', 'web', 'n8n', 'system', 'database', 'monitoring', 'other'] as const
export type PortCategory = (typeof PORT_CATEGORIES)[number]

/**
 * 포트 범위 상수
 */
export const PORT_RANGE = {
  MIN: 1,
  MAX: 65535,
  WELL_KNOWN_MAX: 1023, // well-known 포트 상한
} as const

/**
 * 카테고리별 권장 포트 범위
 * 신규 프로젝트 포트 예약 시 이 범위에서 빈 포트를 추천합니다.
 */
export const PORT_CATEGORY_RANGES: Record<PortCategory, { start: number; end: number; description: string }> = {
  ai: { start: 8000, end: 8099, description: 'AI/ML 서비스 (FastAPI, Flask 등)' },
  web: { start: 3000, end: 3099, description: '웹 프론트엔드 (Next.js, React 등)' },
  n8n: { start: 5600, end: 5699, description: 'N8N 워크플로우 자동화' },
  system: { start: 9000, end: 9099, description: '시스템 서비스 (내부 API 등)' },
  database: { start: 5400, end: 5499, description: '데이터베이스 (PostgreSQL, MySQL 등)' },
  monitoring: { start: 9100, end: 9199, description: '모니터링 (Prometheus, Grafana 등)' },
  other: { start: 10000, end: 10099, description: '기타 서비스' },
} as const

/**
 * 환경별 포트 오프셋
 * 같은 프로젝트의 dev/staging/prod를 구분하기 위한 오프셋
 */
export const PORT_ENVIRONMENT_OFFSET: Record<PortEnvironment, number> = {
  development: 0,    // 기본 범위 사용
  staging: 100,      // +100 오프셋
  production: 200,   // +200 오프셋
} as const

// ============================================================
// DTO 타입 정의
// ============================================================

/**
 * 클라이언트 반환용 PortRegistry DTO
 */
export interface PortRegistryDto {
  id: string
  port: number
  protocol: PortProtocol
  projectId: string | null
  projectName: string
  description: string | null
  environment: PortEnvironment
  status: PortStatus
  internalUrl: string | null
  externalUrl: string | null
  category: PortCategory | null
  tags: string[] // JSON 파싱된 배열
  createdAt: Date
  updatedAt: Date
  createdById: string | null
  createdByUsername: string | null
}

/**
 * 포트 목록 필터 옵션
 */
export interface PortFilterOptions {
  category?: PortCategory
  environment?: PortEnvironment
  status?: PortStatus
  projectId?: string
  search?: string // projectName, description 검색
}

/**
 * 포트 임포트 결과
 */
export interface PortImportResult {
  created: number
  conflicts: string[] // 충돌 포트 번호 목록
}

// ============================================================
// Zod 검증 스키마
// ============================================================

/**
 * 포트 번호 검증 스키마
 * - 1-65535 범위
 * - 정수만 허용
 */
export const PortNumberSchema = z
  .number()
  .int('포트 번호는 정수여야 합니다')
  .min(PORT_RANGE.MIN, `포트 번호는 ${PORT_RANGE.MIN} 이상이어야 합니다`)
  .max(PORT_RANGE.MAX, `포트 번호는 ${PORT_RANGE.MAX} 이하여야 합니다`)

/**
 * 포트 프로토콜 검증 스키마
 */
export const PortProtocolSchema = z.enum(PORT_PROTOCOLS, {
  error: '프로토콜은 tcp 또는 udp여야 합니다',
})

/**
 * 포트 환경 검증 스키마
 */
export const PortEnvironmentSchema = z.enum(PORT_ENVIRONMENTS, {
  error: '환경은 development, staging, production 중 하나여야 합니다',
})

/**
 * 포트 상태 검증 스키마
 */
export const PortStatusSchema = z.enum(PORT_STATUSES, {
  error: '상태는 active, reserved, deprecated 중 하나여야 합니다',
})

/**
 * 포트 카테고리 검증 스키마
 */
export const PortCategorySchema = z.enum(PORT_CATEGORIES, {
  error: '카테고리는 ai, web, n8n, system, database, monitoring, other 중 하나여야 합니다',
})

/**
 * 포트 생성 입력 검증 스키마
 */
export const CreatePortInputSchema = z.object({
  port: PortNumberSchema,
  protocol: PortProtocolSchema.optional().default('tcp'),
  projectId: z.string().optional().nullable(),
  projectName: z
    .string()
    .min(1, '프로젝트 이름은 필수입니다')
    .max(100, '프로젝트 이름은 최대 100자까지 가능합니다'),
  description: z
    .string()
    .max(500, '설명은 최대 500자까지 가능합니다')
    .optional()
    .nullable(),
  environment: PortEnvironmentSchema.optional().default('development'),
  status: PortStatusSchema.optional().default('active'),
  internalUrl: z
    .string()
    .url('유효한 URL을 입력해주세요')
    .optional()
    .nullable(),
  externalUrl: z
    .string()
    .url('유효한 URL을 입력해주세요')
    .optional()
    .nullable(),
  category: PortCategorySchema.optional().nullable(),
  tags: z
    .array(z.string().max(50, '태그는 최대 50자까지 가능합니다'))
    .max(10, '태그는 최대 10개까지 가능합니다')
    .optional()
    .default([]),
})

export type CreatePortInput = z.infer<typeof CreatePortInputSchema>

/**
 * 포트 업데이트 입력 검증 스키마
 * 모든 필드가 선택적 (partial update)
 */
export const UpdatePortInputSchema = z.object({
  port: PortNumberSchema.optional(),
  protocol: PortProtocolSchema.optional(),
  projectId: z.string().optional().nullable(),
  projectName: z
    .string()
    .min(1, '프로젝트 이름은 비어있을 수 없습니다')
    .max(100, '프로젝트 이름은 최대 100자까지 가능합니다')
    .optional(),
  description: z
    .string()
    .max(500, '설명은 최대 500자까지 가능합니다')
    .optional()
    .nullable(),
  environment: PortEnvironmentSchema.optional(),
  status: PortStatusSchema.optional(),
  internalUrl: z
    .string()
    .url('유효한 URL을 입력해주세요')
    .optional()
    .nullable(),
  externalUrl: z
    .string()
    .url('유효한 URL을 입력해주세요')
    .optional()
    .nullable(),
  category: PortCategorySchema.optional().nullable(),
  tags: z
    .array(z.string().max(50, '태그는 최대 50자까지 가능합니다'))
    .max(10, '태그는 최대 10개까지 가능합니다')
    .optional(),
})

export type UpdatePortInput = z.infer<typeof UpdatePortInputSchema>

/**
 * 포트 필터 입력 검증 스키마
 */
export const PortFilterInputSchema = z.object({
  category: PortCategorySchema.optional(),
  environment: PortEnvironmentSchema.optional(),
  status: PortStatusSchema.optional(),
  projectId: z.string().optional(),
  search: z.string().max(100, '검색어는 최대 100자까지 가능합니다').optional(),
})

export type PortFilterInput = z.infer<typeof PortFilterInputSchema>

/**
 * 벌크 포트 임포트 입력 스키마
 */
export const BulkPortImportInputSchema = z.array(CreatePortInputSchema)

export type BulkPortImportInput = z.infer<typeof BulkPortImportInputSchema>

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * well-known 포트인지 확인합니다 (1-1023)
 * @param port 포트 번호
 * @returns well-known 포트 여부
 */
export function isWellKnownPort(port: number): boolean {
  return port >= PORT_RANGE.MIN && port <= PORT_RANGE.WELL_KNOWN_MAX
}

/**
 * 포트 번호가 유효한 범위인지 확인합니다
 * @param port 포트 번호
 * @returns 유효 여부
 */
export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= PORT_RANGE.MIN && port <= PORT_RANGE.MAX
}

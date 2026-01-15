/**
 * Port Service
 * 포트 레지스트리 서비스 레이어
 *
 * Phase 33: Port Registry System
 * - 포트 CRUD
 * - 충돌 감지
 * - 범위 조회
 * - 벌크 임포트
 */

import prisma from '@/lib/prisma'
import type { PortRegistry, User } from '@prisma/client'
import {
  type PortRegistryDto,
  type CreatePortInput,
  type UpdatePortInput,
  type PortFilterOptions,
  type PortImportResult,
  type PortCategory,
  type PortEnvironment,
  CreatePortInputSchema,
  UpdatePortInputSchema,
  isWellKnownPort,
} from '@/types/port'

// ============================================================
// 타입 정의
// ============================================================

/**
 * PortRegistry with creator relation
 */
type PortRegistryWithCreator = PortRegistry & {
  createdBy: Pick<User, 'username'> | null
}

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * tags JSON 문자열을 배열로 파싱합니다.
 * @param tags JSON 문자열 또는 null
 * @returns 문자열 배열
 */
function parseTags(tags: string | null): string[] {
  if (!tags) return []
  try {
    const parsed = JSON.parse(tags)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * tags 배열을 JSON 문자열로 직렬화합니다.
 * @param tags 문자열 배열
 * @returns JSON 문자열
 */
function serializeTags(tags: string[] | undefined): string | null {
  if (!tags || tags.length === 0) return null
  return JSON.stringify(tags)
}

/**
 * Prisma PortRegistry를 PortRegistryDto로 변환합니다.
 * @param port Prisma PortRegistry 엔티티 (createdBy 포함)
 * @returns PortRegistryDto
 */
export function toPortRegistryDto(port: PortRegistryWithCreator): PortRegistryDto {
  return {
    id: port.id,
    port: port.port,
    protocol: port.protocol as PortRegistryDto['protocol'],
    projectId: port.projectId,
    projectName: port.projectName,
    description: port.description,
    environment: port.environment as PortRegistryDto['environment'],
    status: port.status as PortRegistryDto['status'],
    internalUrl: port.internalUrl,
    externalUrl: port.externalUrl,
    category: port.category as PortRegistryDto['category'],
    tags: parseTags(port.tags),
    createdAt: port.createdAt,
    updatedAt: port.updatedAt,
    createdById: port.createdById,
    createdByUsername: port.createdBy?.username ?? null,
  }
}

// ============================================================
// CRUD 함수
// ============================================================

/**
 * 새 포트를 등록합니다.
 *
 * @param input 포트 생성 입력 데이터
 * @param userId 등록자 ID (선택)
 * @returns 생성된 포트 DTO
 * @throws 포트 번호가 이미 존재하면 에러 발생
 */
export async function createPort(
  input: CreatePortInput,
  userId?: string
): Promise<PortRegistryDto> {
  // 입력 검증
  const validated = CreatePortInputSchema.parse(input)

  // 포트 충돌 확인
  const existing = await prisma.portRegistry.findUnique({
    where: { port: validated.port },
  })

  if (existing) {
    throw new Error(`포트 ${validated.port}은(는) 이미 사용 중입니다 (${existing.projectName})`)
  }

  // well-known 포트 경고 로깅 (에러는 아님)
  if (isWellKnownPort(validated.port)) {
    console.warn(`경고: well-known 포트 ${validated.port}을(를) 등록합니다`)
  }

  // 포트 생성
  const port = await prisma.portRegistry.create({
    data: {
      port: validated.port,
      protocol: validated.protocol,
      projectId: validated.projectId ?? null,
      projectName: validated.projectName,
      description: validated.description ?? null,
      environment: validated.environment,
      status: validated.status,
      internalUrl: validated.internalUrl ?? null,
      externalUrl: validated.externalUrl ?? null,
      category: validated.category ?? null,
      tags: serializeTags(validated.tags),
      createdById: userId ?? null,
    },
    include: {
      createdBy: {
        select: { username: true },
      },
    },
  })

  return toPortRegistryDto(port)
}

/**
 * ID로 포트를 조회합니다.
 *
 * @param id 포트 ID
 * @returns 포트 DTO 또는 null
 */
export async function getPortById(id: string): Promise<PortRegistryDto | null> {
  const port = await prisma.portRegistry.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { username: true },
      },
    },
  })

  if (!port) {
    return null
  }

  return toPortRegistryDto(port)
}

/**
 * 포트 번호로 포트를 조회합니다.
 *
 * @param portNumber 포트 번호
 * @returns 포트 DTO 또는 null
 */
export async function getPortByNumber(portNumber: number): Promise<PortRegistryDto | null> {
  const port = await prisma.portRegistry.findUnique({
    where: { port: portNumber },
    include: {
      createdBy: {
        select: { username: true },
      },
    },
  })

  if (!port) {
    return null
  }

  return toPortRegistryDto(port)
}

/**
 * 포트 정보를 업데이트합니다.
 *
 * @param id 포트 ID
 * @param input 업데이트할 데이터
 * @returns 업데이트된 포트 DTO
 * @throws 포트가 없거나 새 포트 번호가 충돌하면 에러 발생
 */
export async function updatePort(
  id: string,
  input: UpdatePortInput
): Promise<PortRegistryDto> {
  // 입력 검증
  const validated = UpdatePortInputSchema.parse(input)

  // 기존 포트 확인
  const existing = await prisma.portRegistry.findUnique({
    where: { id },
  })

  if (!existing) {
    throw new Error('포트를 찾을 수 없습니다')
  }

  // 포트 번호 변경 시 충돌 확인
  if (validated.port !== undefined && validated.port !== existing.port) {
    const conflict = await prisma.portRegistry.findUnique({
      where: { port: validated.port },
    })

    if (conflict) {
      throw new Error(`포트 ${validated.port}은(는) 이미 사용 중입니다 (${conflict.projectName})`)
    }
  }

  // 포트 업데이트
  const port = await prisma.portRegistry.update({
    where: { id },
    data: {
      ...(validated.port !== undefined && { port: validated.port }),
      ...(validated.protocol !== undefined && { protocol: validated.protocol }),
      ...(validated.projectId !== undefined && { projectId: validated.projectId }),
      ...(validated.projectName !== undefined && { projectName: validated.projectName }),
      ...(validated.description !== undefined && { description: validated.description }),
      ...(validated.environment !== undefined && { environment: validated.environment }),
      ...(validated.status !== undefined && { status: validated.status }),
      ...(validated.internalUrl !== undefined && { internalUrl: validated.internalUrl }),
      ...(validated.externalUrl !== undefined && { externalUrl: validated.externalUrl }),
      ...(validated.category !== undefined && { category: validated.category }),
      ...(validated.tags !== undefined && { tags: serializeTags(validated.tags) }),
    },
    include: {
      createdBy: {
        select: { username: true },
      },
    },
  })

  return toPortRegistryDto(port)
}

/**
 * 포트를 삭제합니다.
 *
 * @param id 포트 ID
 * @throws 포트가 없으면 Prisma 에러 발생
 */
export async function deletePort(id: string): Promise<void> {
  await prisma.portRegistry.delete({
    where: { id },
  })
}

/**
 * 모든 포트를 조회합니다.
 * 필터 옵션을 지정할 수 있습니다.
 *
 * @param filters 필터 옵션 (선택)
 * @returns 포트 DTO 배열
 */
export async function getAllPorts(filters?: PortFilterOptions): Promise<PortRegistryDto[]> {
  const where: Record<string, unknown> = {}

  if (filters?.category) {
    where.category = filters.category
  }

  if (filters?.environment) {
    where.environment = filters.environment
  }

  if (filters?.status) {
    where.status = filters.status
  }

  if (filters?.projectId) {
    where.projectId = filters.projectId
  }

  if (filters?.search) {
    where.OR = [
      { projectName: { contains: filters.search } },
      { description: { contains: filters.search } },
    ]
  }

  const ports = await prisma.portRegistry.findMany({
    where,
    include: {
      createdBy: {
        select: { username: true },
      },
    },
    orderBy: { port: 'asc' },
  })

  return ports.map(toPortRegistryDto)
}

// ============================================================
// 충돌 감지 함수
// ============================================================

/**
 * 포트가 이미 사용 중인지 확인합니다.
 *
 * @param portNumber 포트 번호
 * @returns 충돌 여부 (true = 이미 사용 중)
 */
export async function checkPortConflict(portNumber: number): Promise<boolean> {
  const existing = await prisma.portRegistry.findUnique({
    where: { port: portNumber },
  })

  return existing !== null
}

/**
 * 지정된 범위 내에서 사용 가능한 포트를 찾습니다.
 *
 * @param start 시작 포트 번호
 * @param end 종료 포트 번호
 * @returns 사용 가능한 포트 번호 또는 null (범위 내 모든 포트가 사용 중)
 */
export async function findAvailablePort(
  start: number,
  end: number
): Promise<number | null> {
  // 범위 내 사용 중인 포트 목록 조회
  const usedPorts = await prisma.portRegistry.findMany({
    where: {
      port: {
        gte: start,
        lte: end,
      },
    },
    select: { port: true },
    orderBy: { port: 'asc' },
  })

  const usedSet = new Set(usedPorts.map((p) => p.port))

  // 첫 번째 사용 가능한 포트 찾기
  for (let port = start; port <= end; port++) {
    if (!usedSet.has(port)) {
      return port
    }
  }

  return null
}

// ============================================================
// 범위 조회 함수
// ============================================================

/**
 * 특정 카테고리의 포트 목록을 조회합니다.
 *
 * @param category 카테고리
 * @returns 포트 DTO 배열
 */
export async function getPortsByCategory(category: PortCategory): Promise<PortRegistryDto[]> {
  const ports = await prisma.portRegistry.findMany({
    where: { category },
    include: {
      createdBy: {
        select: { username: true },
      },
    },
    orderBy: { port: 'asc' },
  })

  return ports.map(toPortRegistryDto)
}

/**
 * 특정 환경의 포트 목록을 조회합니다.
 *
 * @param environment 환경
 * @returns 포트 DTO 배열
 */
export async function getPortsByEnvironment(environment: PortEnvironment): Promise<PortRegistryDto[]> {
  const ports = await prisma.portRegistry.findMany({
    where: { environment },
    include: {
      createdBy: {
        select: { username: true },
      },
    },
    orderBy: { port: 'asc' },
  })

  return ports.map(toPortRegistryDto)
}

/**
 * 특정 프로젝트의 포트 목록을 조회합니다.
 *
 * @param projectId 프로젝트 ID
 * @returns 포트 DTO 배열
 */
export async function getPortsByProject(projectId: string): Promise<PortRegistryDto[]> {
  const ports = await prisma.portRegistry.findMany({
    where: { projectId },
    include: {
      createdBy: {
        select: { username: true },
      },
    },
    orderBy: { port: 'asc' },
  })

  return ports.map(toPortRegistryDto)
}

// ============================================================
// 벌크 작업 함수
// ============================================================

/**
 * 여러 포트를 일괄 등록합니다.
 * 충돌하는 포트는 건너뛰고 결과를 반환합니다.
 *
 * @param ports 등록할 포트 입력 배열
 * @param userId 등록자 ID (선택)
 * @returns 생성된 개수와 충돌 포트 목록
 */
export async function importPorts(
  ports: CreatePortInput[],
  userId?: string
): Promise<PortImportResult> {
  const conflicts: string[] = []
  let created = 0

  // 기존 포트 번호 목록 조회 (중복 확인용)
  const existingPorts = await prisma.portRegistry.findMany({
    select: { port: true },
  })
  const existingSet = new Set(existingPorts.map((p) => p.port))

  // 입력 포트 목록에서 중복 제거
  const seen = new Set<number>()
  const uniquePorts: CreatePortInput[] = []

  for (const port of ports) {
    // 입력 검증
    const result = CreatePortInputSchema.safeParse(port)
    if (!result.success) {
      conflicts.push(`${port.port} (유효하지 않은 입력)`)
      continue
    }

    // 이미 DB에 있는지 확인
    if (existingSet.has(result.data.port)) {
      conflicts.push(`${result.data.port} (이미 등록됨)`)
      continue
    }

    // 이번 임포트에서 중복인지 확인
    if (seen.has(result.data.port)) {
      conflicts.push(`${result.data.port} (입력 중복)`)
      continue
    }

    seen.add(result.data.port)
    uniquePorts.push(result.data)
  }

  // 벌크 생성
  if (uniquePorts.length > 0) {
    await prisma.portRegistry.createMany({
      data: uniquePorts.map((p) => ({
        port: p.port,
        protocol: p.protocol,
        projectId: p.projectId ?? null,
        projectName: p.projectName,
        description: p.description ?? null,
        environment: p.environment,
        status: p.status,
        internalUrl: p.internalUrl ?? null,
        externalUrl: p.externalUrl ?? null,
        category: p.category ?? null,
        tags: serializeTags(p.tags),
        createdById: userId ?? null,
      })),
    })

    created = uniquePorts.length
  }

  return {
    created,
    conflicts,
  }
}

/**
 * 모든 포트를 삭제합니다. (주의: 복구 불가)
 * 테스트 또는 리셋 용도로만 사용합니다.
 *
 * @returns 삭제된 포트 개수
 */
export async function deleteAllPorts(): Promise<number> {
  const result = await prisma.portRegistry.deleteMany()
  return result.count
}

/**
 * 포트 개수를 조회합니다.
 *
 * @param filters 필터 옵션 (선택)
 * @returns 포트 개수
 */
export async function countPorts(filters?: PortFilterOptions): Promise<number> {
  const where: Record<string, unknown> = {}

  if (filters?.category) {
    where.category = filters.category
  }

  if (filters?.environment) {
    where.environment = filters.environment
  }

  if (filters?.status) {
    where.status = filters.status
  }

  if (filters?.projectId) {
    where.projectId = filters.projectId
  }

  return prisma.portRegistry.count({ where })
}

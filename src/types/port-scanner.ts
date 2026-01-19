/**
 * Port Scanner 타입 정의
 * Phase 43: Port Scanner & Guide
 *
 * 시스템 포트 스캔 및 비교 관련 타입과 Zod 검증 스키마를 정의합니다.
 */

import { z } from 'zod/v4'
import type { PortRegistryDto } from './port'

// ============================================================
// 상수 정의
// ============================================================

/**
 * 포트 상태 (시스템 스캔 결과)
 */
export const PORT_STATES = ['LISTEN'] as const
export type PortState = (typeof PORT_STATES)[number]

/**
 * 프로토콜 종류
 */
export const SCAN_PROTOCOLS = ['tcp', 'udp'] as const
export type ScanProtocol = (typeof SCAN_PROTOCOLS)[number]

// ============================================================
// 인터페이스 정의
// ============================================================

/**
 * 시스템에서 열린 포트 정보
 * ss 명령어 결과를 파싱한 결과
 */
export interface SystemPort {
  /** 포트 번호 */
  port: number
  /** 프로토콜 (tcp 또는 udp) */
  protocol: ScanProtocol
  /** 포트 상태 (LISTEN 상태만 추출) */
  state: PortState
  /** 프로세스 이름 (권한 있을 때만 표시) */
  process?: string
  /** 프로세스 ID (권한 있을 때만 표시) */
  pid?: number
  /** 바인딩 주소 (0.0.0.0, 127.0.0.1, ::, ::1 등) */
  address?: string
}

/**
 * Docker 컨테이너의 포트 바인딩 정보
 * Docker API에서 조회한 결과
 */
export interface DockerPortBinding {
  /** 호스트 포트 번호 */
  hostPort: number
  /** 컨테이너 내부 포트 번호 */
  containerPort: number
  /** 프로토콜 (tcp, udp 등) */
  protocol: string
  /** 컨테이너 ID (short, 12자) */
  containerId: string
  /** 컨테이너 이름 */
  containerName: string
  /** 컨테이너 상태 (running, exited 등) */
  containerState: string
}

/**
 * 등록된 포트와 활성 포트 비교 결과
 */
export interface PortComparisonResult {
  /** 등록되어 있고 Docker에서 활성 상태인 포트 */
  registeredAndActive: Array<{
    /** 등록된 포트 정보 */
    registered: PortRegistryDto
    /** Docker 바인딩 정보 (있을 경우) */
    docker?: DockerPortBinding
  }>
  /** 등록되어 있지만 Docker에 없는 포트 */
  registeredButInactive: PortRegistryDto[]
  /** 등록되지 않았지만 Docker에서 활성 상태인 포트 */
  unregisteredButActive: Array<{
    /** Docker 바인딩 정보 */
    docker: DockerPortBinding
    /** 시스템 포트 정보 (있을 경우) */
    system?: SystemPort
  }>
  /** 요약 통계 */
  summary: {
    /** 등록된 총 포트 수 */
    totalRegistered: number
    /** 활성 상태인 포트 수 */
    activeCount: number
    /** 비활성 상태인 포트 수 */
    inactiveCount: number
    /** 미등록 활성 포트 수 */
    unregisteredCount: number
  }
}

/**
 * 포트 스캔 결과
 * 시스템 포트와 Docker 포트 정보를 함께 반환
 */
export interface PortScanResult {
  /** ss 명령어로 스캔한 시스템 포트 목록 */
  system: SystemPort[]
  /** Docker API로 조회한 포트 바인딩 목록 */
  docker: DockerPortBinding[]
  /** 스캔 시점 (ISO 8601 형식) */
  scannedAt: string
}

// ============================================================
// Zod 검증 스키마
// ============================================================

/**
 * 시스템 포트 검증 스키마
 */
export const SystemPortSchema = z.object({
  port: z.number().int().min(1).max(65535),
  protocol: z.enum(SCAN_PROTOCOLS),
  state: z.enum(PORT_STATES),
  process: z.string().optional(),
  pid: z.number().int().positive().optional(),
  address: z.string().optional(),
})

/**
 * Docker 포트 바인딩 검증 스키마
 */
export const DockerPortBindingSchema = z.object({
  hostPort: z.number().int().min(1).max(65535),
  containerPort: z.number().int().min(1).max(65535),
  protocol: z.string(),
  containerId: z.string(),
  containerName: z.string(),
  containerState: z.string(),
})

/**
 * 포트 스캔 결과 검증 스키마
 */
export const PortScanResultSchema = z.object({
  system: z.array(SystemPortSchema),
  docker: z.array(DockerPortBindingSchema),
  scannedAt: z.string().datetime(),
})

// ============================================================
// 타입 가드
// ============================================================

/**
 * SystemPort 타입 가드
 * @param value 검사할 값
 * @returns SystemPort 타입 여부
 */
export function isSystemPort(value: unknown): value is SystemPort {
  return SystemPortSchema.safeParse(value).success
}

/**
 * DockerPortBinding 타입 가드
 * @param value 검사할 값
 * @returns DockerPortBinding 타입 여부
 */
export function isDockerPortBinding(value: unknown): value is DockerPortBinding {
  return DockerPortBindingSchema.safeParse(value).success
}

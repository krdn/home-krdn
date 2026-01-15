/**
 * Settings Service
 * 사용자 대시보드 설정 관리 서비스 레이어
 *
 * Phase 20: 사용자별 설정(테마, 알림, 레이아웃) 관리
 */

import prisma from '@/lib/prisma'
import { z } from 'zod/v4'
import type { UserSettings } from '@prisma/client'

// ============================================================
// 타입 정의
// ============================================================

/**
 * 클라이언트 반환용 UserSettings DTO
 * 필요한 필드만 노출
 */
export interface UserSettingsDto {
  id: string
  dashboardLayout: string | null
  theme: string
  emailNotifications: boolean
  pushNotifications: boolean
}

/**
 * 설정 업데이트 입력 검증 스키마
 */
export const UpdateSettingsInputSchema = z.object({
  theme: z
    .enum(['dark', 'light'], {
      error: '테마는 dark 또는 light 중 선택해야 합니다',
    })
    .optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  dashboardLayout: z.string().optional(),
})

export type UpdateSettingsInput = z.infer<typeof UpdateSettingsInputSchema>

// ============================================================
// 기본값 상수
// ============================================================

const DEFAULT_SETTINGS = {
  theme: 'dark',
  emailNotifications: true,
  pushNotifications: false,
  dashboardLayout: null,
} as const

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * Prisma UserSettings를 DTO로 변환
 * @param settings Prisma UserSettings 엔티티
 * @returns UserSettingsDto
 */
function toSettingsDto(settings: UserSettings): UserSettingsDto {
  return {
    id: settings.id,
    dashboardLayout: settings.dashboardLayout,
    theme: settings.theme,
    emailNotifications: settings.emailNotifications,
    pushNotifications: settings.pushNotifications,
  }
}

/**
 * 사용자 설정 조회 또는 생성 (내부 헬퍼)
 * 설정이 없으면 기본값으로 생성합니다.
 *
 * @param userId 사용자 ID
 * @returns UserSettings 엔티티
 * @throws userId가 존재하지 않으면 Prisma 에러 발생
 */
async function getOrCreateUserSettings(userId: string): Promise<UserSettings> {
  // upsert를 사용하여 조회 또는 생성
  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: {}, // 이미 존재하면 아무것도 업데이트하지 않음
    create: {
      userId,
      theme: DEFAULT_SETTINGS.theme,
      emailNotifications: DEFAULT_SETTINGS.emailNotifications,
      pushNotifications: DEFAULT_SETTINGS.pushNotifications,
      dashboardLayout: DEFAULT_SETTINGS.dashboardLayout,
    },
  })

  return settings
}

// ============================================================
// 공개 API
// ============================================================

/**
 * 사용자 설정을 조회합니다.
 * 설정이 없으면 기본값으로 생성 후 반환합니다.
 *
 * @param userId 사용자 ID
 * @returns UserSettingsDto
 * @throws userId가 존재하지 않으면 에러 발생
 */
export async function getUserSettings(userId: string): Promise<UserSettingsDto> {
  const settings = await getOrCreateUserSettings(userId)
  return toSettingsDto(settings)
}

/**
 * 사용자 설정을 업데이트합니다.
 * 부분 업데이트를 지원합니다.
 *
 * @param userId 사용자 ID
 * @param data 업데이트할 설정 데이터
 * @returns 업데이트된 UserSettingsDto
 * @throws userId가 존재하지 않으면 에러 발생
 */
export async function updateUserSettings(
  userId: string,
  data: UpdateSettingsInput
): Promise<UserSettingsDto> {
  // 먼저 설정이 존재하는지 확인 (없으면 생성)
  await getOrCreateUserSettings(userId)

  // 업데이트 수행
  const updated = await prisma.userSettings.update({
    where: { userId },
    data: {
      ...(data.theme !== undefined && { theme: data.theme }),
      ...(data.emailNotifications !== undefined && {
        emailNotifications: data.emailNotifications,
      }),
      ...(data.pushNotifications !== undefined && {
        pushNotifications: data.pushNotifications,
      }),
      ...(data.dashboardLayout !== undefined && {
        dashboardLayout: data.dashboardLayout,
      }),
    },
  })

  return toSettingsDto(updated)
}

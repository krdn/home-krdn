/**
 * Settings Service 단위 테스트
 *
 * Prisma mocking을 통한 격리된 단위 테스트
 * Phase 25: Test Coverage Expansion
 */

import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import type { UserSettings } from '@prisma/client'

// Prisma mock 설정
vi.mock('./prisma', () => ({
  default: {
    userSettings: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import prisma from './prisma'
import {
  getUserSettings,
  updateUserSettings,
  UpdateSettingsInputSchema,
} from './settings-service'
import type { UpdateSettingsInput, UserSettingsDto } from './settings-service'

// Mock 데이터
const mockUserSettings: UserSettings = {
  id: 'settings001',
  userId: 'cluser001',
  dashboardLayout: null,
  theme: 'dark',
  emailNotifications: true,
  pushNotifications: false,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
}

const mockUserSettingsLight: UserSettings = {
  ...mockUserSettings,
  id: 'settings002',
  userId: 'cluser002',
  theme: 'light',
  emailNotifications: false,
  pushNotifications: true,
}

const mockUserSettingsWithLayout: UserSettings = {
  ...mockUserSettings,
  id: 'settings003',
  userId: 'cluser003',
  dashboardLayout: '{"widgets":["clock","weather"]}',
}

describe('Settings Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================
  // UpdateSettingsInputSchema 테스트
  // ============================================================
  describe('UpdateSettingsInputSchema', () => {
    it('유효한 dark 테마를 허용한다', () => {
      const result = UpdateSettingsInputSchema.safeParse({ theme: 'dark' })
      expect(result.success).toBe(true)
    })

    it('유효한 light 테마를 허용한다', () => {
      const result = UpdateSettingsInputSchema.safeParse({ theme: 'light' })
      expect(result.success).toBe(true)
    })

    it('잘못된 테마 값을 거부한다', () => {
      const result = UpdateSettingsInputSchema.safeParse({ theme: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('boolean 알림 설정을 허용한다', () => {
      const result = UpdateSettingsInputSchema.safeParse({
        emailNotifications: true,
        pushNotifications: false,
      })
      expect(result.success).toBe(true)
    })

    it('문자열 알림 설정을 거부한다', () => {
      const result = UpdateSettingsInputSchema.safeParse({
        emailNotifications: 'true',
      })
      expect(result.success).toBe(false)
    })

    it('빈 객체를 허용한다 (모든 필드 optional)', () => {
      const result = UpdateSettingsInputSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('dashboardLayout 문자열을 허용한다', () => {
      const result = UpdateSettingsInputSchema.safeParse({
        dashboardLayout: '{"widgets":[]}',
      })
      expect(result.success).toBe(true)
    })

    it('모든 필드를 동시에 포함할 수 있다', () => {
      const result = UpdateSettingsInputSchema.safeParse({
        theme: 'dark',
        emailNotifications: true,
        pushNotifications: false,
        dashboardLayout: 'custom-layout',
      })
      expect(result.success).toBe(true)
    })
  })

  // ============================================================
  // getUserSettings 테스트
  // ============================================================
  describe('getUserSettings', () => {
    it('기존 설정을 조회하여 DTO로 반환한다', async () => {
      const mockUpsert = prisma.userSettings.upsert as MockedFunction<typeof prisma.userSettings.upsert>
      mockUpsert.mockResolvedValue(mockUserSettings)

      const result = await getUserSettings('cluser001')

      expect(prisma.userSettings.upsert).toHaveBeenCalledWith({
        where: { userId: 'cluser001' },
        update: {},
        create: expect.objectContaining({
          userId: 'cluser001',
          theme: 'dark',
          emailNotifications: true,
          pushNotifications: false,
          dashboardLayout: null,
        }),
      })

      // DTO 형태로 반환되는지 확인
      expect(result).toEqual({
        id: 'settings001',
        dashboardLayout: null,
        theme: 'dark',
        emailNotifications: true,
        pushNotifications: false,
      })
    })

    it('설정이 없으면 기본값으로 생성 후 반환한다', async () => {
      const mockUpsert = prisma.userSettings.upsert as MockedFunction<typeof prisma.userSettings.upsert>
      const newSettings: UserSettings = {
        id: 'settings004',
        userId: 'newuser001',
        dashboardLayout: null,
        theme: 'dark',
        emailNotifications: true,
        pushNotifications: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockUpsert.mockResolvedValue(newSettings)

      const result = await getUserSettings('newuser001')

      expect(result.theme).toBe('dark')
      expect(result.emailNotifications).toBe(true)
      expect(result.pushNotifications).toBe(false)
      expect(result.dashboardLayout).toBeNull()
    })

    it('light 테마 설정을 올바르게 반환한다', async () => {
      const mockUpsert = prisma.userSettings.upsert as MockedFunction<typeof prisma.userSettings.upsert>
      mockUpsert.mockResolvedValue(mockUserSettingsLight)

      const result = await getUserSettings('cluser002')

      expect(result.theme).toBe('light')
      expect(result.emailNotifications).toBe(false)
      expect(result.pushNotifications).toBe(true)
    })

    it('dashboardLayout이 있는 설정을 올바르게 반환한다', async () => {
      const mockUpsert = prisma.userSettings.upsert as MockedFunction<typeof prisma.userSettings.upsert>
      mockUpsert.mockResolvedValue(mockUserSettingsWithLayout)

      const result = await getUserSettings('cluser003')

      expect(result.dashboardLayout).toBe('{"widgets":["clock","weather"]}')
    })
  })

  // ============================================================
  // updateUserSettings 테스트
  // ============================================================
  describe('updateUserSettings', () => {
    it('테마만 업데이트한다 (부분 업데이트)', async () => {
      const mockUpsert = prisma.userSettings.upsert as MockedFunction<typeof prisma.userSettings.upsert>
      const mockUpdate = prisma.userSettings.update as MockedFunction<typeof prisma.userSettings.update>

      mockUpsert.mockResolvedValue(mockUserSettings)
      const updatedSettings = { ...mockUserSettings, theme: 'light' }
      mockUpdate.mockResolvedValue(updatedSettings)

      const result = await updateUserSettings('cluser001', { theme: 'light' })

      expect(prisma.userSettings.update).toHaveBeenCalledWith({
        where: { userId: 'cluser001' },
        data: { theme: 'light' },
      })
      expect(result.theme).toBe('light')
    })

    it('이메일 알림 설정만 업데이트한다', async () => {
      const mockUpsert = prisma.userSettings.upsert as MockedFunction<typeof prisma.userSettings.upsert>
      const mockUpdate = prisma.userSettings.update as MockedFunction<typeof prisma.userSettings.update>

      mockUpsert.mockResolvedValue(mockUserSettings)
      const updatedSettings = { ...mockUserSettings, emailNotifications: false }
      mockUpdate.mockResolvedValue(updatedSettings)

      const result = await updateUserSettings('cluser001', { emailNotifications: false })

      expect(prisma.userSettings.update).toHaveBeenCalledWith({
        where: { userId: 'cluser001' },
        data: { emailNotifications: false },
      })
      expect(result.emailNotifications).toBe(false)
    })

    it('푸시 알림 설정만 업데이트한다', async () => {
      const mockUpsert = prisma.userSettings.upsert as MockedFunction<typeof prisma.userSettings.upsert>
      const mockUpdate = prisma.userSettings.update as MockedFunction<typeof prisma.userSettings.update>

      mockUpsert.mockResolvedValue(mockUserSettings)
      const updatedSettings = { ...mockUserSettings, pushNotifications: true }
      mockUpdate.mockResolvedValue(updatedSettings)

      const result = await updateUserSettings('cluser001', { pushNotifications: true })

      expect(prisma.userSettings.update).toHaveBeenCalledWith({
        where: { userId: 'cluser001' },
        data: { pushNotifications: true },
      })
      expect(result.pushNotifications).toBe(true)
    })

    it('dashboardLayout만 업데이트한다', async () => {
      const mockUpsert = prisma.userSettings.upsert as MockedFunction<typeof prisma.userSettings.upsert>
      const mockUpdate = prisma.userSettings.update as MockedFunction<typeof prisma.userSettings.update>

      mockUpsert.mockResolvedValue(mockUserSettings)
      const newLayout = '{"widgets":["calendar","tasks"]}'
      const updatedSettings = { ...mockUserSettings, dashboardLayout: newLayout }
      mockUpdate.mockResolvedValue(updatedSettings)

      const result = await updateUserSettings('cluser001', { dashboardLayout: newLayout })

      expect(prisma.userSettings.update).toHaveBeenCalledWith({
        where: { userId: 'cluser001' },
        data: { dashboardLayout: newLayout },
      })
      expect(result.dashboardLayout).toBe(newLayout)
    })

    it('여러 설정을 동시에 업데이트한다', async () => {
      const mockUpsert = prisma.userSettings.upsert as MockedFunction<typeof prisma.userSettings.upsert>
      const mockUpdate = prisma.userSettings.update as MockedFunction<typeof prisma.userSettings.update>

      mockUpsert.mockResolvedValue(mockUserSettings)
      const updatedSettings = {
        ...mockUserSettings,
        theme: 'light',
        emailNotifications: false,
        pushNotifications: true,
      }
      mockUpdate.mockResolvedValue(updatedSettings)

      const input: UpdateSettingsInput = {
        theme: 'light',
        emailNotifications: false,
        pushNotifications: true,
      }
      const result = await updateUserSettings('cluser001', input)

      expect(prisma.userSettings.update).toHaveBeenCalledWith({
        where: { userId: 'cluser001' },
        data: {
          theme: 'light',
          emailNotifications: false,
          pushNotifications: true,
        },
      })
      expect(result.theme).toBe('light')
      expect(result.emailNotifications).toBe(false)
      expect(result.pushNotifications).toBe(true)
    })

    it('빈 객체로 업데이트 시 아무것도 변경하지 않는다', async () => {
      const mockUpsert = prisma.userSettings.upsert as MockedFunction<typeof prisma.userSettings.upsert>
      const mockUpdate = prisma.userSettings.update as MockedFunction<typeof prisma.userSettings.update>

      mockUpsert.mockResolvedValue(mockUserSettings)
      mockUpdate.mockResolvedValue(mockUserSettings)

      const result = await updateUserSettings('cluser001', {})

      expect(prisma.userSettings.update).toHaveBeenCalledWith({
        where: { userId: 'cluser001' },
        data: {},
      })
      // 기존 값 유지
      expect(result.theme).toBe('dark')
      expect(result.emailNotifications).toBe(true)
    })

    it('설정이 없는 사용자에게 업데이트 시 먼저 생성 후 업데이트한다', async () => {
      const mockUpsert = prisma.userSettings.upsert as MockedFunction<typeof prisma.userSettings.upsert>
      const mockUpdate = prisma.userSettings.update as MockedFunction<typeof prisma.userSettings.update>

      // 먼저 upsert로 설정 생성/조회
      const newSettings: UserSettings = {
        id: 'settings005',
        userId: 'newuser002',
        dashboardLayout: null,
        theme: 'dark',
        emailNotifications: true,
        pushNotifications: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockUpsert.mockResolvedValue(newSettings)

      // 그 후 업데이트
      const updatedSettings = { ...newSettings, theme: 'light' }
      mockUpdate.mockResolvedValue(updatedSettings)

      const result = await updateUserSettings('newuser002', { theme: 'light' })

      // getOrCreateUserSettings가 먼저 호출됨
      expect(prisma.userSettings.upsert).toHaveBeenCalled()
      // 그 후 업데이트 호출
      expect(prisma.userSettings.update).toHaveBeenCalledWith({
        where: { userId: 'newuser002' },
        data: { theme: 'light' },
      })
      expect(result.theme).toBe('light')
    })
  })

  // ============================================================
  // DTO 변환 테스트
  // ============================================================
  describe('DTO 변환', () => {
    it('반환된 DTO에는 createdAt이 포함되지 않는다', async () => {
      const mockUpsert = prisma.userSettings.upsert as MockedFunction<typeof prisma.userSettings.upsert>
      mockUpsert.mockResolvedValue(mockUserSettings)

      const result = await getUserSettings('cluser001')

      expect(result).not.toHaveProperty('createdAt')
    })

    it('반환된 DTO에는 updatedAt이 포함되지 않는다', async () => {
      const mockUpsert = prisma.userSettings.upsert as MockedFunction<typeof prisma.userSettings.upsert>
      mockUpsert.mockResolvedValue(mockUserSettings)

      const result = await getUserSettings('cluser001')

      expect(result).not.toHaveProperty('updatedAt')
    })

    it('반환된 DTO에는 userId가 포함되지 않는다', async () => {
      const mockUpsert = prisma.userSettings.upsert as MockedFunction<typeof prisma.userSettings.upsert>
      mockUpsert.mockResolvedValue(mockUserSettings)

      const result = await getUserSettings('cluser001')

      expect(result).not.toHaveProperty('userId')
    })

    it('반환된 DTO에 필수 필드만 포함된다', async () => {
      const mockUpsert = prisma.userSettings.upsert as MockedFunction<typeof prisma.userSettings.upsert>
      mockUpsert.mockResolvedValue(mockUserSettings)

      const result = await getUserSettings('cluser001')

      const expectedKeys = ['id', 'dashboardLayout', 'theme', 'emailNotifications', 'pushNotifications']
      expect(Object.keys(result).sort()).toEqual(expectedKeys.sort())
    })
  })

  // ============================================================
  // 엣지 케이스 테스트
  // ============================================================
  describe('엣지 케이스', () => {
    it('null dashboardLayout을 올바르게 처리한다', async () => {
      const mockUpsert = prisma.userSettings.upsert as MockedFunction<typeof prisma.userSettings.upsert>
      mockUpsert.mockResolvedValue({ ...mockUserSettings, dashboardLayout: null })

      const result = await getUserSettings('cluser001')

      expect(result.dashboardLayout).toBeNull()
    })

    it('빈 문자열 dashboardLayout을 허용한다', async () => {
      const mockUpsert = prisma.userSettings.upsert as MockedFunction<typeof prisma.userSettings.upsert>
      const mockUpdate = prisma.userSettings.update as MockedFunction<typeof prisma.userSettings.update>

      mockUpsert.mockResolvedValue(mockUserSettings)
      mockUpdate.mockResolvedValue({ ...mockUserSettings, dashboardLayout: '' })

      const result = await updateUserSettings('cluser001', { dashboardLayout: '' })

      expect(result.dashboardLayout).toBe('')
    })

    it('특수 문자가 포함된 dashboardLayout을 처리한다', async () => {
      const mockUpsert = prisma.userSettings.upsert as MockedFunction<typeof prisma.userSettings.upsert>
      const mockUpdate = prisma.userSettings.update as MockedFunction<typeof prisma.userSettings.update>

      const specialLayout = '{"name":"<script>alert(1)</script>","emoji":"🎉"}'
      mockUpsert.mockResolvedValue(mockUserSettings)
      mockUpdate.mockResolvedValue({ ...mockUserSettings, dashboardLayout: specialLayout })

      const result = await updateUserSettings('cluser001', { dashboardLayout: specialLayout })

      expect(result.dashboardLayout).toBe(specialLayout)
    })
  })
})

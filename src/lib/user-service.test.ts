/**
 * User Service 단위 테스트
 *
 * Prisma mocking을 통한 격리된 단위 테스트
 * Phase 25: Test Coverage Expansion
 */

import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import type { User, Role } from '@prisma/client'

// Prisma mock 설정
vi.mock('./prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    passwordResetToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Auth mock 설정 (hashPassword 함수)
vi.mock('./auth', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed_password_mock'),
}))

import prisma from './prisma'
import {
  toUserDto,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  updateLastLogin,
  updateUserProfile,
  updatePasswordHash,
  isEmailTaken,
  isUsernameTaken,
  createUser,
  updateUserRole,
  getAllUsers,
  countUsersByRole,
  createPasswordResetToken,
  findValidPasswordResetToken,
  markTokenAsUsed,
  deleteExpiredTokens,
} from './user-service'
import type { RegisterInput } from './user-service'

// Mock 데이터
const mockUser: User = {
  id: 'cluser001',
  email: 'test@example.com',
  username: 'testuser',
  passwordHash: 'hashed_password',
  role: 'USER',
  displayName: 'Test User',
  avatarUrl: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  lastLoginAt: null,
}

const mockAdminUser: User = {
  ...mockUser,
  id: 'cladmin001',
  email: 'admin@example.com',
  username: 'admin',
  role: 'ADMIN',
  displayName: 'Admin User',
}

describe('User Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================
  // toUserDto 테스트
  // ============================================================
  describe('toUserDto', () => {
    it('Prisma User를 UserDto로 올바르게 변환한다', () => {
      const dto = toUserDto(mockUser)

      expect(dto).toEqual({
        id: 'cluser001',
        username: 'testuser',
        role: 'user',
      })
    })

    it('ADMIN 역할을 admin으로 변환한다', () => {
      const dto = toUserDto(mockAdminUser)

      expect(dto.role).toBe('admin')
    })

    it('VIEWER 역할을 viewer로 변환한다', () => {
      const viewerUser = { ...mockUser, role: 'VIEWER' as Role }
      const dto = toUserDto(viewerUser)

      expect(dto.role).toBe('viewer')
    })

    it('알 수 없는 역할은 user로 기본 변환한다', () => {
      // 타입 시스템 우회하여 알 수 없는 역할 테스트
      const unknownRoleUser = { ...mockUser, role: 'UNKNOWN' as Role }
      const dto = toUserDto(unknownRoleUser)

      expect(dto.role).toBe('user')
    })
  })

  // ============================================================
  // findUserByUsername 테스트
  // ============================================================
  describe('findUserByUsername', () => {
    it('존재하는 사용자명으로 사용자를 조회한다', async () => {
      const mockFindUnique = prisma.user.findUnique as MockedFunction<typeof prisma.user.findUnique>
      mockFindUnique.mockResolvedValue(mockUser)

      const result = await findUserByUsername('testuser')

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      })
      expect(result).toEqual(mockUser)
    })

    it('존재하지 않는 사용자명은 null을 반환한다', async () => {
      const mockFindUnique = prisma.user.findUnique as MockedFunction<typeof prisma.user.findUnique>
      mockFindUnique.mockResolvedValue(null)

      const result = await findUserByUsername('nonexistent')

      expect(result).toBeNull()
    })
  })

  // ============================================================
  // findUserByEmail 테스트
  // ============================================================
  describe('findUserByEmail', () => {
    it('존재하는 이메일로 사용자를 조회한다', async () => {
      const mockFindUnique = prisma.user.findUnique as MockedFunction<typeof prisma.user.findUnique>
      mockFindUnique.mockResolvedValue(mockUser)

      const result = await findUserByEmail('test@example.com')

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
      expect(result).toEqual(mockUser)
    })

    it('존재하지 않는 이메일은 null을 반환한다', async () => {
      const mockFindUnique = prisma.user.findUnique as MockedFunction<typeof prisma.user.findUnique>
      mockFindUnique.mockResolvedValue(null)

      const result = await findUserByEmail('notfound@example.com')

      expect(result).toBeNull()
    })
  })

  // ============================================================
  // findUserById 테스트
  // ============================================================
  describe('findUserById', () => {
    it('존재하는 ID로 사용자를 조회한다', async () => {
      const mockFindUnique = prisma.user.findUnique as MockedFunction<typeof prisma.user.findUnique>
      mockFindUnique.mockResolvedValue(mockUser)

      const result = await findUserById('cluser001')

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'cluser001' },
      })
      expect(result).toEqual(mockUser)
    })

    it('존재하지 않는 ID는 null을 반환한다', async () => {
      const mockFindUnique = prisma.user.findUnique as MockedFunction<typeof prisma.user.findUnique>
      mockFindUnique.mockResolvedValue(null)

      const result = await findUserById('nonexistent-id')

      expect(result).toBeNull()
    })
  })

  // ============================================================
  // updateLastLogin 테스트
  // ============================================================
  describe('updateLastLogin', () => {
    it('사용자 로그인 시간을 업데이트한다', async () => {
      const mockUpdate = prisma.user.update as MockedFunction<typeof prisma.user.update>
      mockUpdate.mockResolvedValue(mockUser)

      await updateLastLogin('cluser001')

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'cluser001' },
        data: expect.objectContaining({
          lastLoginAt: expect.any(Date),
        }),
      })
    })
  })

  // ============================================================
  // updateUserProfile 테스트
  // ============================================================
  describe('updateUserProfile', () => {
    it('displayName을 업데이트한다', async () => {
      const updatedUser = { ...mockUser, displayName: 'New Name' }
      const mockUpdate = prisma.user.update as MockedFunction<typeof prisma.user.update>
      mockUpdate.mockResolvedValue(updatedUser)

      const result = await updateUserProfile('cluser001', { displayName: 'New Name' })

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'cluser001' },
        data: { displayName: 'New Name' },
      })
      expect(result.displayName).toBe('New Name')
    })

    it('avatarUrl을 업데이트한다', async () => {
      const updatedUser = { ...mockUser, avatarUrl: 'https://example.com/avatar.png' }
      const mockUpdate = prisma.user.update as MockedFunction<typeof prisma.user.update>
      mockUpdate.mockResolvedValue(updatedUser)

      const result = await updateUserProfile('cluser001', { avatarUrl: 'https://example.com/avatar.png' })

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'cluser001' },
        data: { avatarUrl: 'https://example.com/avatar.png' },
      })
      expect(result.avatarUrl).toBe('https://example.com/avatar.png')
    })
  })

  // ============================================================
  // updatePasswordHash 테스트
  // ============================================================
  describe('updatePasswordHash', () => {
    it('비밀번호 해시를 업데이트한다', async () => {
      const mockUpdate = prisma.user.update as MockedFunction<typeof prisma.user.update>
      mockUpdate.mockResolvedValue(mockUser)

      await updatePasswordHash('cluser001', 'new_hash_value')

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'cluser001' },
        data: { passwordHash: 'new_hash_value' },
      })
    })
  })

  // ============================================================
  // isEmailTaken / isUsernameTaken 테스트
  // ============================================================
  describe('isEmailTaken', () => {
    it('이메일이 사용 중이면 true를 반환한다', async () => {
      const mockCount = prisma.user.count as MockedFunction<typeof prisma.user.count>
      mockCount.mockResolvedValue(1)

      const result = await isEmailTaken('test@example.com')

      expect(result).toBe(true)
    })

    it('이메일이 사용되지 않으면 false를 반환한다', async () => {
      const mockCount = prisma.user.count as MockedFunction<typeof prisma.user.count>
      mockCount.mockResolvedValue(0)

      const result = await isEmailTaken('new@example.com')

      expect(result).toBe(false)
    })
  })

  describe('isUsernameTaken', () => {
    it('사용자명이 사용 중이면 true를 반환한다', async () => {
      const mockCount = prisma.user.count as MockedFunction<typeof prisma.user.count>
      mockCount.mockResolvedValue(1)

      const result = await isUsernameTaken('testuser')

      expect(result).toBe(true)
    })

    it('사용자명이 사용되지 않으면 false를 반환한다', async () => {
      const mockCount = prisma.user.count as MockedFunction<typeof prisma.user.count>
      mockCount.mockResolvedValue(0)

      const result = await isUsernameTaken('newuser')

      expect(result).toBe(false)
    })
  })

  // ============================================================
  // createUser 테스트
  // ============================================================
  describe('createUser', () => {
    const validInput: RegisterInput = {
      email: 'new@example.com',
      username: 'newuser',
      password: 'password123',
      displayName: 'New User',
    }

    it('새 사용자를 생성하고 passwordHash 없이 반환한다', async () => {
      const mockCreate = prisma.user.create as MockedFunction<typeof prisma.user.create>
      mockCreate.mockResolvedValue({
        ...mockUser,
        email: validInput.email,
        username: validInput.username,
        displayName: validInput.displayName ?? null,
      })

      const result = await createUser(validInput)

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: validInput.email,
          username: validInput.username,
          passwordHash: 'hashed_password_mock', // mock된 해시값
          displayName: validInput.displayName,
        },
      })
      expect(result).not.toHaveProperty('passwordHash')
      expect(result.email).toBe(validInput.email)
    })

    it('displayName 없이 사용자를 생성할 수 있다', async () => {
      const inputWithoutName: RegisterInput = {
        email: 'another@example.com',
        username: 'anotheruser',
        password: 'password456',
      }

      const mockCreate = prisma.user.create as MockedFunction<typeof prisma.user.create>
      mockCreate.mockResolvedValue({
        ...mockUser,
        email: inputWithoutName.email,
        username: inputWithoutName.username,
        displayName: null,
      })

      const result = await createUser(inputWithoutName)

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: inputWithoutName.email,
          username: inputWithoutName.username,
          displayName: undefined,
        }),
      })
      expect(result.displayName).toBeNull()
    })
  })

  // ============================================================
  // updateUserRole 테스트
  // ============================================================
  describe('updateUserRole', () => {
    it('사용자 역할을 ADMIN으로 변경한다', async () => {
      const updatedUser = { ...mockUser, role: 'ADMIN' as Role }
      const mockUpdate = prisma.user.update as MockedFunction<typeof prisma.user.update>
      mockUpdate.mockResolvedValue(updatedUser)

      const result = await updateUserRole('cluser001', 'ADMIN')

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'cluser001' },
        data: { role: 'ADMIN' },
      })
      expect(result).not.toHaveProperty('passwordHash')
      expect(result.id).toBe('cluser001')
    })

    it('사용자 역할을 VIEWER로 변경한다', async () => {
      const updatedUser = { ...mockUser, role: 'VIEWER' as Role }
      const mockUpdate = prisma.user.update as MockedFunction<typeof prisma.user.update>
      mockUpdate.mockResolvedValue(updatedUser)

      const result = await updateUserRole('cluser001', 'VIEWER')

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'cluser001' },
        data: { role: 'VIEWER' },
      })
    })
  })

  // ============================================================
  // getAllUsers 테스트
  // ============================================================
  describe('getAllUsers', () => {
    it('모든 사용자를 조회한다', async () => {
      const mockFindMany = prisma.user.findMany as MockedFunction<typeof prisma.user.findMany>
      mockFindMany.mockResolvedValue([
        {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          role: mockUser.role,
          displayName: mockUser.displayName,
          avatarUrl: mockUser.avatarUrl,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
          lastLoginAt: mockUser.lastLoginAt,
        },
      ] as User[])

      const result = await getAllUsers()

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: undefined,
        skip: undefined,
        take: undefined,
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      })
      expect(result).toHaveLength(1)
    })

    it('역할별로 필터링하여 조회한다', async () => {
      const mockFindMany = prisma.user.findMany as MockedFunction<typeof prisma.user.findMany>
      mockFindMany.mockResolvedValue([])

      await getAllUsers({ role: 'ADMIN' })

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: 'ADMIN' },
        })
      )
    })

    it('페이지네이션 옵션을 적용한다', async () => {
      const mockFindMany = prisma.user.findMany as MockedFunction<typeof prisma.user.findMany>
      mockFindMany.mockResolvedValue([])

      await getAllUsers({ skip: 10, take: 5 })

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      )
    })
  })

  // ============================================================
  // countUsersByRole 테스트
  // ============================================================
  describe('countUsersByRole', () => {
    it('특정 역할의 사용자 수를 반환한다', async () => {
      const mockCount = prisma.user.count as MockedFunction<typeof prisma.user.count>
      mockCount.mockResolvedValue(3)

      const result = await countUsersByRole('USER')

      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { role: 'USER' },
      })
      expect(result).toBe(3)
    })

    it('해당 역할의 사용자가 없으면 0을 반환한다', async () => {
      const mockCount = prisma.user.count as MockedFunction<typeof prisma.user.count>
      mockCount.mockResolvedValue(0)

      const result = await countUsersByRole('ADMIN')

      expect(result).toBe(0)
    })
  })

  // ============================================================
  // 비밀번호 재설정 토큰 테스트
  // ============================================================
  describe('createPasswordResetToken', () => {
    it('비밀번호 재설정 토큰을 생성한다', async () => {
      const mockDeleteMany = prisma.passwordResetToken.deleteMany as MockedFunction<typeof prisma.passwordResetToken.deleteMany>
      const mockCreate = prisma.passwordResetToken.create as MockedFunction<typeof prisma.passwordResetToken.create>

      mockDeleteMany.mockResolvedValue({ count: 0 })
      mockCreate.mockResolvedValue({
        id: 'token001',
        token: 'generated_token',
        userId: 'cluser001',
        expiresAt: new Date(),
        usedAt: null,
        createdAt: new Date(),
      })

      const result = await createPasswordResetToken('cluser001')

      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'cluser001',
          usedAt: null,
        },
      })
      expect(prisma.passwordResetToken.create).toHaveBeenCalled()
      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('expiresAt')
    })
  })

  describe('findValidPasswordResetToken', () => {
    it('유효한 토큰을 찾으면 사용자 정보와 함께 반환한다', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000) // 1시간 후
      const mockFindUnique = prisma.passwordResetToken.findUnique as MockedFunction<typeof prisma.passwordResetToken.findUnique>
      mockFindUnique.mockResolvedValue({
        id: 'token001',
        token: 'valid_token',
        userId: 'cluser001',
        expiresAt: futureDate,
        usedAt: null,
        createdAt: new Date(),
        user: mockUser,
      } as Parameters<typeof mockFindUnique>[0] extends { include: { user: true } }
        ? Awaited<ReturnType<typeof mockFindUnique>>
        : never)

      const result = await findValidPasswordResetToken('valid_token')

      expect(prisma.passwordResetToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'valid_token' },
        include: { user: true },
      })
      expect(result).not.toBeNull()
      expect(result?.user).toEqual(mockUser)
    })

    it('토큰이 없으면 null을 반환한다', async () => {
      const mockFindUnique = prisma.passwordResetToken.findUnique as MockedFunction<typeof prisma.passwordResetToken.findUnique>
      mockFindUnique.mockResolvedValue(null)

      const result = await findValidPasswordResetToken('nonexistent_token')

      expect(result).toBeNull()
    })

    it('만료된 토큰은 null을 반환한다', async () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000) // 1시간 전
      const mockFindUnique = prisma.passwordResetToken.findUnique as MockedFunction<typeof prisma.passwordResetToken.findUnique>
      mockFindUnique.mockResolvedValue({
        id: 'token001',
        token: 'expired_token',
        userId: 'cluser001',
        expiresAt: pastDate,
        usedAt: null,
        createdAt: new Date(),
        user: mockUser,
      } as Parameters<typeof mockFindUnique>[0] extends { include: { user: true } }
        ? Awaited<ReturnType<typeof mockFindUnique>>
        : never)

      const result = await findValidPasswordResetToken('expired_token')

      expect(result).toBeNull()
    })

    it('이미 사용된 토큰은 null을 반환한다', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000)
      const mockFindUnique = prisma.passwordResetToken.findUnique as MockedFunction<typeof prisma.passwordResetToken.findUnique>
      mockFindUnique.mockResolvedValue({
        id: 'token001',
        token: 'used_token',
        userId: 'cluser001',
        expiresAt: futureDate,
        usedAt: new Date(), // 이미 사용됨
        createdAt: new Date(),
        user: mockUser,
      } as Parameters<typeof mockFindUnique>[0] extends { include: { user: true } }
        ? Awaited<ReturnType<typeof mockFindUnique>>
        : never)

      const result = await findValidPasswordResetToken('used_token')

      expect(result).toBeNull()
    })
  })

  describe('markTokenAsUsed', () => {
    it('토큰을 사용 처리한다', async () => {
      const mockUpdate = prisma.passwordResetToken.update as MockedFunction<typeof prisma.passwordResetToken.update>
      mockUpdate.mockResolvedValue({
        id: 'token001',
        token: 'some_token',
        userId: 'cluser001',
        expiresAt: new Date(),
        usedAt: new Date(),
        createdAt: new Date(),
      })

      await markTokenAsUsed('token001')

      expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: 'token001' },
        data: expect.objectContaining({
          usedAt: expect.any(Date),
        }),
      })
    })
  })

  describe('deleteExpiredTokens', () => {
    it('만료된 토큰들을 삭제하고 삭제된 개수를 반환한다', async () => {
      const mockDeleteMany = prisma.passwordResetToken.deleteMany as MockedFunction<typeof prisma.passwordResetToken.deleteMany>
      mockDeleteMany.mockResolvedValue({ count: 5 })

      const result = await deleteExpiredTokens()

      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: expect.any(Array),
        },
      })
      expect(result).toBe(5)
    })
  })
})

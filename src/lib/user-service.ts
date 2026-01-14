/**
 * User Service
 * Prisma 기반 사용자 데이터 액세스 레이어
 *
 * Prisma User와 레거시 User 타입 간의 호환 레이어를 제공합니다.
 * Phase 18 이후 점진적으로 DB 기반으로 전환됩니다.
 */

import prisma from '@/lib/prisma'
import { z } from 'zod/v4'
import crypto from 'crypto'
import type { User, PasswordResetToken, Role } from '@prisma/client'
import type { UserRole } from '@/types/auth'
import { PrismaRoleToLegacy } from '@/types/auth'
import { hashPassword } from './auth'

/**
 * 레거시 User DTO 타입
 * 기존 JWT 시스템과 호환되는 간소화된 유저 정보
 */
export interface UserDto {
  id: string
  username: string
  role: UserRole
}

/**
 * Prisma User를 레거시 User 타입으로 변환
 * @param user Prisma User 엔티티
 * @returns 레거시 호환 UserDto
 */
export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    username: user.username,
    role: PrismaRoleToLegacy[user.role] ?? 'user',
  }
}

/**
 * 사용자명으로 사용자 조회
 * @param username 사용자명
 * @returns Prisma User 또는 null
 */
export async function findUserByUsername(username: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { username },
  })
}

/**
 * 이메일로 사용자 조회
 * @param email 이메일 주소
 * @returns Prisma User 또는 null
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  })
}

/**
 * ID로 사용자 조회
 * @param id 사용자 ID (cuid)
 * @returns Prisma User 또는 null
 */
export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  })
}

/**
 * 로그인 시간 업데이트
 * @param userId 사용자 ID
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  })
}

/**
 * 사용자 프로필 업데이트
 * @param userId 사용자 ID
 * @param data 업데이트할 데이터
 */
export async function updateUserProfile(
  userId: string,
  data: {
    displayName?: string
    avatarUrl?: string
  }
): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data,
  })
}

/**
 * 사용자 비밀번호 해시 업데이트
 * @param userId 사용자 ID
 * @param passwordHash 새 비밀번호 해시
 */
export async function updatePasswordHash(
  userId: string,
  passwordHash: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  })
}

// ============================================================
// 회원가입 관련 함수 (Phase 18)
// ============================================================

/**
 * 회원가입 입력 검증 스키마
 */
export const RegisterInputSchema = z.object({
  email: z.email('유효한 이메일 주소를 입력해주세요'),
  username: z
    .string()
    .min(3, '사용자명은 최소 3자 이상이어야 합니다')
    .max(20, '사용자명은 최대 20자까지 가능합니다')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      '사용자명은 영문, 숫자, 밑줄(_)만 사용할 수 있습니다'
    ),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  displayName: z
    .string()
    .max(50, '표시 이름은 최대 50자까지 가능합니다')
    .optional(),
})

export type RegisterInput = z.infer<typeof RegisterInputSchema>

/**
 * 회원가입 결과 타입 (passwordHash 제외)
 */
export type CreateUserResult = Omit<User, 'passwordHash'>

/**
 * 이메일 중복 여부 확인
 * @param email 이메일 주소
 * @returns 이미 사용 중이면 true
 */
export async function isEmailTaken(email: string): Promise<boolean> {
  const count = await prisma.user.count({
    where: { email },
  })
  return count > 0
}

/**
 * 사용자명 중복 여부 확인
 * @param username 사용자명
 * @returns 이미 사용 중이면 true
 */
export async function isUsernameTaken(username: string): Promise<boolean> {
  const count = await prisma.user.count({
    where: { username },
  })
  return count > 0
}

/**
 * 새 사용자 생성
 * 비밀번호는 자동으로 해싱됩니다.
 *
 * @param input 회원가입 입력 데이터
 * @returns 생성된 사용자 (passwordHash 제외)
 */
export async function createUser(input: RegisterInput): Promise<CreateUserResult> {
  // 비밀번호 해싱
  const passwordHash = await hashPassword(input.password)

  // 사용자 생성
  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      passwordHash,
      displayName: input.displayName,
      // role은 기본값 USER 사용 (schema.prisma에서 설정)
    },
  })

  // passwordHash 제외하고 반환
  const { passwordHash: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

// ============================================================
// 비밀번호 재설정 관련 함수 (Phase 18)
// ============================================================

/**
 * 토큰 만료 시간 (1시간)
 */
const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1

/**
 * 비밀번호 재설정 토큰 생성 결과 타입
 */
export interface CreatePasswordResetTokenResult {
  token: string
  expiresAt: Date
}

/**
 * 유효한 비밀번호 재설정 토큰 (사용자 정보 포함)
 */
export type PasswordResetTokenWithUser = PasswordResetToken & {
  user: User
}

/**
 * 비밀번호 재설정 토큰을 생성합니다.
 * 기존 미사용 토큰은 삭제됩니다.
 *
 * @param userId 사용자 ID
 * @returns 생성된 토큰 정보 { token, expiresAt }
 */
export async function createPasswordResetToken(
  userId: string
): Promise<CreatePasswordResetTokenResult> {
  // 기존 미사용 토큰 삭제 (중복 방지)
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId,
      usedAt: null,
    },
  })

  // 안전한 토큰 생성 (32바이트 = 64자 hex)
  const token = crypto.randomBytes(32).toString('hex')

  // 만료 시간 계산 (1시간 후)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS)

  // 토큰 저장
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  })

  return { token, expiresAt }
}

/**
 * 유효한 비밀번호 재설정 토큰을 조회합니다.
 * 만료되지 않고 사용되지 않은 토큰만 반환합니다.
 *
 * @param token 토큰 문자열
 * @returns 토큰 객체 (user 포함) 또는 null
 */
export async function findValidPasswordResetToken(
  token: string
): Promise<PasswordResetTokenWithUser | null> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!resetToken) {
    return null
  }

  // 만료 시간 검사
  if (resetToken.expiresAt < new Date()) {
    return null
  }

  // 사용 여부 검사
  if (resetToken.usedAt !== null) {
    return null
  }

  return resetToken
}

/**
 * 토큰을 사용 처리합니다 (usedAt 업데이트).
 *
 * @param tokenId 토큰 ID
 */
export async function markTokenAsUsed(tokenId: string): Promise<void> {
  await prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: { usedAt: new Date() },
  })
}

/**
 * 만료된 토큰들을 삭제합니다.
 * 배치 작업용 (cron job 등에서 호출)
 *
 * @returns 삭제된 토큰 개수
 */
export async function deleteExpiredTokens(): Promise<number> {
  const result = await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        // 만료된 토큰
        { expiresAt: { lt: new Date() } },
        // 이미 사용된 토큰 (7일 이상 지난 것만)
        {
          usedAt: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      ],
    },
  })

  return result.count
}

// ============================================================
// 역할 관리 관련 함수 (Phase 18)
// ============================================================

/**
 * 역할 변경 입력 스키마
 */
export const UpdateRoleInputSchema = z.object({
  role: z.enum(['ADMIN', 'USER', 'VIEWER'], {
    error: '유효한 역할(ADMIN, USER, VIEWER)을 입력해주세요',
  }),
})

export type UpdateRoleInput = z.infer<typeof UpdateRoleInputSchema>

/**
 * 사용자 정보 (passwordHash 제외)
 */
export type UserWithoutPassword = Omit<User, 'passwordHash'>

/**
 * 사용자 역할을 변경합니다.
 *
 * @param userId 대상 사용자 ID
 * @param role 새 역할 (ADMIN, USER, VIEWER)
 * @returns 업데이트된 사용자 정보 (passwordHash 제외)
 * @throws 사용자가 없으면 Prisma 에러 발생
 */
export async function updateUserRole(
  userId: string,
  role: Role
): Promise<UserWithoutPassword> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  })

  // passwordHash 제외하고 반환
  const { passwordHash: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * 사용자 목록 조회 옵션
 */
export interface GetAllUsersOptions {
  skip?: number
  take?: number
  role?: Role
}

/**
 * 사용자 목록을 조회합니다.
 * 페이지네이션과 역할 필터링을 지원합니다.
 *
 * @param options 조회 옵션 (skip, take, role)
 * @returns 사용자 목록 (passwordHash 제외)
 */
export async function getAllUsers(
  options?: GetAllUsersOptions
): Promise<UserWithoutPassword[]> {
  const { skip, take, role } = options ?? {}

  const users = await prisma.user.findMany({
    where: role ? { role } : undefined,
    skip,
    take,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      displayName: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
    },
  })

  return users
}

/**
 * 특정 역할을 가진 사용자 수를 조회합니다.
 *
 * @param role 역할
 * @returns 해당 역할의 사용자 수
 */
export async function countUsersByRole(role: Role): Promise<number> {
  return prisma.user.count({
    where: { role },
  })
}

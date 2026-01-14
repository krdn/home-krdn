/**
 * User Service
 * Prisma 기반 사용자 데이터 액세스 레이어
 *
 * Prisma User와 레거시 User 타입 간의 호환 레이어를 제공합니다.
 * Phase 18 이후 점진적으로 DB 기반으로 전환됩니다.
 */

import prisma from '@/lib/prisma'
import { z } from 'zod/v4'
import type { User } from '@prisma/client'
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

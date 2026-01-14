/**
 * User Service
 * Prisma 기반 사용자 데이터 액세스 레이어
 *
 * Prisma User와 레거시 User 타입 간의 호환 레이어를 제공합니다.
 * Phase 18 이후 점진적으로 DB 기반으로 전환됩니다.
 */

import prisma from '@/lib/prisma'
import type { User } from '@prisma/client'
import type { UserRole } from '@/types/auth'
import { PrismaRoleToLegacy } from '@/types/auth'

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

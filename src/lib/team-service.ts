/**
 * Team Service
 * 팀 및 팀 멤버 관리 서비스 레이어
 *
 * Phase 21: Team Features
 * - 팀 CRUD
 * - 멤버 관리
 * - 초대 시스템
 * - 권한 검사 헬퍼
 */

import prisma from '@/lib/prisma'
import { z } from 'zod/v4'
import crypto from 'crypto'
import type { Team, TeamMember, TeamInvite, TeamSettings, User, Role } from '@prisma/client'

// ============================================================
// 타입 정의
// ============================================================

/**
 * 클라이언트 반환용 Team DTO
 */
export interface TeamDto {
  id: string
  name: string
  slug: string
  description: string | null
  ownerId: string
  ownerUsername: string
  memberCount: number
  createdAt: Date
}

/**
 * 클라이언트 반환용 TeamMember DTO
 */
export interface TeamMemberDto {
  id: string
  userId: string
  username: string
  displayName: string | null
  role: Role
  joinedAt: Date
}

/**
 * 클라이언트 반환용 TeamInvite DTO
 */
export interface TeamInviteDto {
  id: string
  token: string
  email: string
  role: Role
  teamId: string
  teamName: string
  invitedByUsername: string
  expiresAt: Date
  createdAt: Date
}

/**
 * 클라이언트 반환용 TeamSettings DTO
 */
export interface TeamSettingsDto {
  id: string
  teamId: string
  emailNotifications: boolean
  slackWebhookUrl: string | null
  notifyOnAlert: boolean
  notifyOnMemberJoin: boolean
  notifyOnMemberLeave: boolean
  updatedAt: Date
}

/**
 * 팀 생성 입력 검증 스키마
 */
export const CreateTeamInputSchema = z.object({
  name: z
    .string()
    .min(2, '팀 이름은 최소 2자 이상이어야 합니다')
    .max(50, '팀 이름은 최대 50자까지 가능합니다'),
  description: z
    .string()
    .max(200, '팀 설명은 최대 200자까지 가능합니다')
    .optional(),
})

export type CreateTeamInput = z.infer<typeof CreateTeamInputSchema>

/**
 * 팀 업데이트 입력 검증 스키마
 */
export const UpdateTeamInputSchema = z.object({
  name: z
    .string()
    .min(2, '팀 이름은 최소 2자 이상이어야 합니다')
    .max(50, '팀 이름은 최대 50자까지 가능합니다')
    .optional(),
  description: z
    .string()
    .max(200, '팀 설명은 최대 200자까지 가능합니다')
    .optional()
    .nullable(),
})

export type UpdateTeamInput = z.infer<typeof UpdateTeamInputSchema>

/**
 * 멤버 추가 입력 검증 스키마
 */
export const AddMemberInputSchema = z.object({
  userId: z.string().min(1, '사용자 ID가 필요합니다'),
  role: z.enum(['ADMIN', 'USER', 'VIEWER'], {
    error: '유효한 역할(ADMIN, USER, VIEWER)을 입력해주세요',
  }).optional().default('USER'),
})

export type AddMemberInput = z.infer<typeof AddMemberInputSchema>

/**
 * 멤버 역할 변경 입력 검증 스키마
 */
export const UpdateMemberRoleInputSchema = z.object({
  role: z.enum(['ADMIN', 'USER', 'VIEWER'], {
    error: '유효한 역할(ADMIN, USER, VIEWER)을 입력해주세요',
  }),
})

export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleInputSchema>

/**
 * 초대 생성 입력 검증 스키마
 */
export const CreateInviteInputSchema = z.object({
  email: z.email('유효한 이메일 주소를 입력해주세요'),
  role: z.enum(['ADMIN', 'USER', 'VIEWER'], {
    error: '유효한 역할(ADMIN, USER, VIEWER)을 입력해주세요',
  }).optional().default('USER'),
})

export type CreateInviteInput = z.infer<typeof CreateInviteInputSchema>

/**
 * 팀 설정 업데이트 입력 검증 스키마
 */
export const UpdateTeamSettingsInputSchema = z.object({
  emailNotifications: z.boolean().optional(),
  slackWebhookUrl: z
    .string()
    .url('유효한 URL을 입력해주세요')
    .optional()
    .nullable(),
  notifyOnAlert: z.boolean().optional(),
  notifyOnMemberJoin: z.boolean().optional(),
  notifyOnMemberLeave: z.boolean().optional(),
})

export type UpdateTeamSettingsInput = z.infer<typeof UpdateTeamSettingsInputSchema>

// ============================================================
// 헬퍼 함수
// ============================================================

// Team with owner and member count type
type TeamWithOwnerAndCount = Team & {
  owner: Pick<User, 'username'>
  _count: { members: number }
}

// TeamMember with user type
type TeamMemberWithUser = TeamMember & {
  user: Pick<User, 'username' | 'displayName'>
}

// TeamInvite with relations type
type TeamInviteWithRelations = TeamInvite & {
  team: Pick<Team, 'name'>
  invitedBy: Pick<User, 'username'>
}

/**
 * Prisma Team을 TeamDto로 변환
 * @param team Prisma Team 엔티티 (owner, _count 포함)
 * @returns TeamDto
 */
export function toTeamDto(team: TeamWithOwnerAndCount): TeamDto {
  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    description: team.description,
    ownerId: team.ownerId,
    ownerUsername: team.owner.username,
    memberCount: team._count.members,
    createdAt: team.createdAt,
  }
}

/**
 * Prisma TeamMember를 TeamMemberDto로 변환
 * @param member Prisma TeamMember 엔티티 (user 포함)
 * @returns TeamMemberDto
 */
export function toTeamMemberDto(member: TeamMemberWithUser): TeamMemberDto {
  return {
    id: member.id,
    userId: member.userId,
    username: member.user.username,
    displayName: member.user.displayName,
    role: member.role,
    joinedAt: member.joinedAt,
  }
}

/**
 * Prisma TeamInvite를 TeamInviteDto로 변환
 * @param invite Prisma TeamInvite 엔티티 (team, invitedBy 포함)
 * @returns TeamInviteDto
 */
export function toTeamInviteDto(invite: TeamInviteWithRelations): TeamInviteDto {
  return {
    id: invite.id,
    token: invite.token,
    email: invite.email,
    role: invite.role,
    teamId: invite.teamId,
    teamName: invite.team.name,
    invitedByUsername: invite.invitedBy.username,
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
  }
}

/**
 * Prisma TeamSettings를 TeamSettingsDto로 변환
 * @param settings Prisma TeamSettings 엔티티
 * @returns TeamSettingsDto
 */
export function toTeamSettingsDto(settings: TeamSettings): TeamSettingsDto {
  return {
    id: settings.id,
    teamId: settings.teamId,
    emailNotifications: settings.emailNotifications,
    slackWebhookUrl: settings.slackWebhookUrl,
    notifyOnAlert: settings.notifyOnAlert,
    notifyOnMemberJoin: settings.notifyOnMemberJoin,
    notifyOnMemberLeave: settings.notifyOnMemberLeave,
    updatedAt: settings.updatedAt,
  }
}

/**
 * 팀 이름에서 slug를 생성합니다.
 * kebab-case로 변환하고 중복 시 숫자 suffix를 추가합니다.
 *
 * @param name 팀 이름
 * @returns 고유한 slug
 */
export async function generateTeamSlug(name: string): Promise<string> {
  // 한글 등 비-ASCII 문자 처리를 위해 정규화
  const baseSlug = name
    .toLowerCase()
    .trim()
    // 공백을 하이픈으로 변환
    .replace(/\s+/g, '-')
    // 알파벳, 숫자, 하이픈, 한글만 허용
    .replace(/[^a-z0-9\-\uac00-\ud7af]/g, '')
    // 연속된 하이픈 제거
    .replace(/-+/g, '-')
    // 앞뒤 하이픈 제거
    .replace(/^-|-$/g, '')

  // 빈 문자열이면 기본값 사용
  const slug = baseSlug || 'team'

  // 중복 확인
  const existing = await prisma.team.findUnique({
    where: { slug },
  })

  if (!existing) {
    return slug
  }

  // 중복 시 숫자 suffix 추가
  let suffix = 2
  while (true) {
    const slugWithSuffix = `${slug}-${suffix}`
    const existingWithSuffix = await prisma.team.findUnique({
      where: { slug: slugWithSuffix },
    })

    if (!existingWithSuffix) {
      return slugWithSuffix
    }

    suffix++

    // 무한 루프 방지 (최대 1000번)
    if (suffix > 1000) {
      throw new Error('팀 slug 생성 실패: 너무 많은 중복')
    }
  }
}

// ============================================================
// 팀 CRUD 함수
// ============================================================

/**
 * 새 팀을 생성합니다.
 * 소유자는 자동으로 ADMIN 멤버로 추가됩니다.
 *
 * @param ownerId 팀 소유자 ID
 * @param input 팀 생성 입력 데이터
 * @returns 생성된 팀 DTO
 */
export async function createTeam(
  ownerId: string,
  input: CreateTeamInput
): Promise<TeamDto> {
  // slug 생성
  const slug = await generateTeamSlug(input.name)

  // 팀 생성 + 소유자를 ADMIN 멤버로 추가 (트랜잭션)
  const team = await prisma.team.create({
    data: {
      name: input.name,
      slug,
      description: input.description ?? null,
      ownerId,
      members: {
        create: {
          userId: ownerId,
          role: 'ADMIN',
        },
      },
    },
    include: {
      owner: {
        select: { username: true },
      },
      _count: {
        select: { members: true },
      },
    },
  })

  return toTeamDto(team)
}

/**
 * 팀 ID로 팀을 조회합니다.
 *
 * @param teamId 팀 ID
 * @returns 팀 DTO 또는 null
 */
export async function getTeamById(teamId: string): Promise<TeamDto | null> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      owner: {
        select: { username: true },
      },
      _count: {
        select: { members: true },
      },
    },
  })

  if (!team) {
    return null
  }

  return toTeamDto(team)
}

/**
 * slug로 팀을 조회합니다.
 *
 * @param slug 팀 slug
 * @returns 팀 DTO 또는 null
 */
export async function getTeamBySlug(slug: string): Promise<TeamDto | null> {
  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      owner: {
        select: { username: true },
      },
      _count: {
        select: { members: true },
      },
    },
  })

  if (!team) {
    return null
  }

  return toTeamDto(team)
}

/**
 * 팀 정보를 업데이트합니다.
 *
 * @param teamId 팀 ID
 * @param input 업데이트할 데이터
 * @returns 업데이트된 팀 DTO
 * @throws 팀이 없으면 Prisma 에러 발생
 */
export async function updateTeam(
  teamId: string,
  input: UpdateTeamInput
): Promise<TeamDto> {
  // 이름이 변경되면 slug도 업데이트
  let newSlug: string | undefined
  if (input.name) {
    newSlug = await generateTeamSlug(input.name)
  }

  const team = await prisma.team.update({
    where: { id: teamId },
    data: {
      ...(input.name && { name: input.name, slug: newSlug }),
      ...(input.description !== undefined && { description: input.description }),
    },
    include: {
      owner: {
        select: { username: true },
      },
      _count: {
        select: { members: true },
      },
    },
  })

  return toTeamDto(team)
}

/**
 * 팀을 삭제합니다.
 * Cascade로 팀 멤버도 함께 삭제됩니다.
 *
 * @param teamId 팀 ID
 * @throws 팀이 없으면 Prisma 에러 발생
 */
export async function deleteTeam(teamId: string): Promise<void> {
  await prisma.team.delete({
    where: { id: teamId },
  })
}

/**
 * 사용자가 속한 모든 팀 목록을 조회합니다.
 *
 * @param userId 사용자 ID
 * @returns 팀 DTO 배열
 */
export async function getUserTeams(userId: string): Promise<TeamDto[]> {
  // 사용자가 멤버인 팀 조회
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          owner: {
            select: { username: true },
          },
          _count: {
            select: { members: true },
          },
        },
      },
    },
    orderBy: {
      joinedAt: 'desc',
    },
  })

  return memberships.map((m) => toTeamDto(m.team))
}

// ============================================================
// 멤버 관리 함수
// ============================================================

/**
 * 팀에 멤버를 추가합니다.
 *
 * @param teamId 팀 ID
 * @param userId 추가할 사용자 ID
 * @param role 멤버 역할 (기본: USER)
 * @returns 추가된 멤버 DTO
 * @throws 이미 멤버인 경우 에러 발생
 */
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: Role = 'USER'
): Promise<TeamMemberDto> {
  // 이미 멤버인지 확인
  const existingMember = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: { userId, teamId },
    },
  })

  if (existingMember) {
    throw new Error('이미 팀 멤버입니다')
  }

  const member = await prisma.teamMember.create({
    data: {
      teamId,
      userId,
      role,
    },
    include: {
      user: {
        select: { username: true, displayName: true },
      },
    },
  })

  return toTeamMemberDto(member)
}

/**
 * 팀에서 멤버를 제거합니다.
 *
 * @param teamId 팀 ID
 * @param userId 제거할 사용자 ID
 * @throws 멤버가 아닌 경우 에러 발생
 */
export async function removeTeamMember(
  teamId: string,
  userId: string
): Promise<void> {
  // 소유자는 제거할 수 없음
  const team = await prisma.team.findUnique({
    where: { id: teamId },
  })

  if (team && team.ownerId === userId) {
    throw new Error('팀 소유자는 제거할 수 없습니다')
  }

  await prisma.teamMember.delete({
    where: {
      userId_teamId: { userId, teamId },
    },
  })
}

/**
 * 멤버의 역할을 변경합니다.
 *
 * @param teamId 팀 ID
 * @param userId 대상 사용자 ID
 * @param role 새 역할
 * @returns 업데이트된 멤버 DTO
 */
export async function updateMemberRole(
  teamId: string,
  userId: string,
  role: Role
): Promise<TeamMemberDto> {
  const member = await prisma.teamMember.update({
    where: {
      userId_teamId: { userId, teamId },
    },
    data: { role },
    include: {
      user: {
        select: { username: true, displayName: true },
      },
    },
  })

  return toTeamMemberDto(member)
}

/**
 * 팀의 모든 멤버를 조회합니다.
 *
 * @param teamId 팀 ID
 * @returns 멤버 DTO 배열
 */
export async function getTeamMembers(teamId: string): Promise<TeamMemberDto[]> {
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: {
        select: { username: true, displayName: true },
      },
    },
    orderBy: [
      { role: 'asc' }, // ADMIN이 먼저
      { joinedAt: 'asc' },
    ],
  })

  return members.map(toTeamMemberDto)
}

/**
 * 사용자가 팀의 멤버인지 확인합니다.
 *
 * @param teamId 팀 ID
 * @param userId 사용자 ID
 * @returns 멤버 여부
 */
export async function isTeamMember(
  teamId: string,
  userId: string
): Promise<boolean> {
  const member = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: { userId, teamId },
    },
  })

  return member !== null
}

/**
 * 사용자가 팀의 소유자인지 확인합니다.
 *
 * @param teamId 팀 ID
 * @param userId 사용자 ID
 * @returns 소유자 여부
 */
export async function isTeamOwner(
  teamId: string,
  userId: string
): Promise<boolean> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
  })

  return team !== null && team.ownerId === userId
}

/**
 * 사용자의 팀 내 역할을 조회합니다.
 *
 * @param teamId 팀 ID
 * @param userId 사용자 ID
 * @returns 역할 또는 null (멤버가 아닌 경우)
 */
export async function getMemberRole(
  teamId: string,
  userId: string
): Promise<Role | null> {
  const member = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: { userId, teamId },
    },
  })

  return member?.role ?? null
}

/**
 * 사용자가 팀 관리 권한이 있는지 확인합니다.
 * (소유자이거나 ADMIN 역할)
 *
 * @param teamId 팀 ID
 * @param userId 사용자 ID
 * @returns 관리 권한 여부
 */
export async function hasTeamAdminAccess(
  teamId: string,
  userId: string
): Promise<boolean> {
  // 소유자인지 확인
  const team = await prisma.team.findUnique({
    where: { id: teamId },
  })

  if (!team) {
    return false
  }

  if (team.ownerId === userId) {
    return true
  }

  // ADMIN 멤버인지 확인
  const member = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: { userId, teamId },
    },
  })

  return member !== null && member.role === 'ADMIN'
}

// ============================================================
// 초대 관리 함수
// ============================================================

/**
 * 초대 토큰 만료 시간 (7일)
 */
const INVITE_TOKEN_EXPIRY_DAYS = 7

/**
 * 팀 초대를 생성합니다.
 * 동일 이메일에 대한 기존 미사용 초대는 삭제됩니다.
 *
 * @param teamId 팀 ID
 * @param invitedById 초대하는 사용자 ID
 * @param input 초대 생성 입력 (email, role)
 * @returns 생성된 초대 DTO
 * @throws 팀이 없거나 이미 멤버인 경우 에러
 */
export async function createTeamInvite(
  teamId: string,
  invitedById: string,
  input: CreateInviteInput
): Promise<TeamInviteDto> {
  // 팀 존재 확인
  const team = await prisma.team.findUnique({
    where: { id: teamId },
  })

  if (!team) {
    throw new Error('팀을 찾을 수 없습니다')
  }

  // 이미 팀 멤버인지 확인 (이메일로 사용자 조회)
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    include: {
      teamMemberships: {
        where: { teamId },
      },
    },
  })

  if (existingUser && existingUser.teamMemberships.length > 0) {
    throw new Error('이미 팀 멤버입니다')
  }

  // 기존 미사용 초대 삭제 (동일 이메일 + 팀)
  await prisma.teamInvite.deleteMany({
    where: {
      teamId,
      email: input.email,
      usedAt: null,
    },
  })

  // 안전한 토큰 생성 (32바이트 = 64자 hex)
  const token = crypto.randomBytes(32).toString('hex')

  // 만료 시간 계산 (7일 후)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + INVITE_TOKEN_EXPIRY_DAYS)

  // 초대 생성
  const invite = await prisma.teamInvite.create({
    data: {
      token,
      email: input.email,
      role: input.role ?? 'USER',
      teamId,
      invitedById,
      expiresAt,
    },
    include: {
      team: {
        select: { name: true },
      },
      invitedBy: {
        select: { username: true },
      },
    },
  })

  return toTeamInviteDto(invite)
}

/**
 * 팀의 활성 초대 목록을 조회합니다.
 * 만료되지 않고 사용되지 않은 초대만 반환합니다.
 *
 * @param teamId 팀 ID
 * @returns 초대 DTO 배열
 */
export async function getTeamInvites(teamId: string): Promise<TeamInviteDto[]> {
  const invites = await prisma.teamInvite.findMany({
    where: {
      teamId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      team: {
        select: { name: true },
      },
      invitedBy: {
        select: { username: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return invites.map(toTeamInviteDto)
}

/**
 * 이메일로 받은 대기 중인 초대 목록을 조회합니다.
 * 만료되지 않고 사용되지 않은 초대만 반환합니다.
 *
 * @param email 이메일 주소
 * @returns 초대 DTO 배열
 */
export async function getPendingInvitesByEmail(email: string): Promise<TeamInviteDto[]> {
  const invites = await prisma.teamInvite.findMany({
    where: {
      email,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      team: {
        select: { name: true },
      },
      invitedBy: {
        select: { username: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return invites.map(toTeamInviteDto)
}

/**
 * 유효한 초대를 토큰으로 조회합니다.
 * 만료되지 않고 사용되지 않은 초대만 반환합니다.
 *
 * @param token 초대 토큰
 * @returns 초대 DTO 또는 null
 */
export async function findValidInvite(token: string): Promise<TeamInviteDto | null> {
  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: {
      team: {
        select: { name: true },
      },
      invitedBy: {
        select: { username: true },
      },
    },
  })

  if (!invite) {
    return null
  }

  // 만료 시간 검사
  if (invite.expiresAt < new Date()) {
    return null
  }

  // 사용 여부 검사
  if (invite.usedAt !== null) {
    return null
  }

  return toTeamInviteDto(invite)
}

/**
 * 초대를 수락합니다.
 * 사용자를 팀 멤버로 추가하고 초대를 사용 처리합니다.
 *
 * @param token 초대 토큰
 * @param userId 수락하는 사용자 ID
 * @returns 추가된 멤버 DTO
 * @throws 초대가 유효하지 않거나 이미 멤버인 경우 에러
 */
export async function acceptInvite(
  token: string,
  userId: string
): Promise<TeamMemberDto> {
  // 초대 조회 (관계 포함)
  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: {
      team: true,
    },
  })

  if (!invite) {
    throw new Error('초대를 찾을 수 없습니다')
  }

  // 만료 시간 검사
  if (invite.expiresAt < new Date()) {
    throw new Error('초대가 만료되었습니다')
  }

  // 사용 여부 검사
  if (invite.usedAt !== null) {
    throw new Error('이미 사용된 초대입니다')
  }

  // 이미 팀 멤버인지 확인
  const existingMember = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: { userId, teamId: invite.teamId },
    },
  })

  if (existingMember) {
    throw new Error('이미 팀 멤버입니다')
  }

  // 트랜잭션: 멤버 추가 + 초대 사용 처리
  const [member] = await prisma.$transaction([
    // 멤버 추가
    prisma.teamMember.create({
      data: {
        teamId: invite.teamId,
        userId,
        role: invite.role,
      },
      include: {
        user: {
          select: { username: true, displayName: true },
        },
      },
    }),
    // 초대 사용 처리
    prisma.teamInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    }),
  ])

  return toTeamMemberDto(member)
}

/**
 * 초대를 취소(삭제)합니다.
 *
 * @param inviteId 초대 ID
 * @throws 초대가 없으면 Prisma 에러 발생
 */
export async function cancelInvite(inviteId: string): Promise<void> {
  await prisma.teamInvite.delete({
    where: { id: inviteId },
  })
}

/**
 * 만료된 초대들을 삭제합니다.
 * 배치 작업용 (cron job 등에서 호출)
 *
 * @returns 삭제된 초대 개수
 */
export async function deleteExpiredInvites(): Promise<number> {
  const result = await prisma.teamInvite.deleteMany({
    where: {
      OR: [
        // 만료된 초대
        { expiresAt: { lt: new Date() } },
        // 이미 사용된 초대 (7일 이상 지난 것만)
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
// 팀 설정 관리 함수
// ============================================================

/**
 * 팀 설정을 조회합니다.
 * 설정이 없으면 기본값으로 생성합니다 (upsert 패턴).
 *
 * @param teamId 팀 ID
 * @returns 팀 설정 DTO
 */
export async function getTeamSettings(teamId: string): Promise<TeamSettingsDto> {
  // upsert: 없으면 기본값으로 생성
  const settings = await prisma.teamSettings.upsert({
    where: { teamId },
    create: {
      teamId,
      emailNotifications: true,
      notifyOnAlert: true,
      notifyOnMemberJoin: true,
      notifyOnMemberLeave: false,
    },
    update: {}, // 이미 있으면 변경 없음
  })

  return toTeamSettingsDto(settings)
}

/**
 * 팀 설정을 업데이트합니다.
 *
 * @param teamId 팀 ID
 * @param input 업데이트할 설정 데이터
 * @returns 업데이트된 팀 설정 DTO
 */
export async function updateTeamSettings(
  teamId: string,
  input: UpdateTeamSettingsInput
): Promise<TeamSettingsDto> {
  // upsert: 없으면 생성, 있으면 업데이트
  const settings = await prisma.teamSettings.upsert({
    where: { teamId },
    create: {
      teamId,
      emailNotifications: input.emailNotifications ?? true,
      slackWebhookUrl: input.slackWebhookUrl ?? null,
      notifyOnAlert: input.notifyOnAlert ?? true,
      notifyOnMemberJoin: input.notifyOnMemberJoin ?? true,
      notifyOnMemberLeave: input.notifyOnMemberLeave ?? false,
    },
    update: {
      ...(input.emailNotifications !== undefined && {
        emailNotifications: input.emailNotifications,
      }),
      ...(input.slackWebhookUrl !== undefined && {
        slackWebhookUrl: input.slackWebhookUrl,
      }),
      ...(input.notifyOnAlert !== undefined && {
        notifyOnAlert: input.notifyOnAlert,
      }),
      ...(input.notifyOnMemberJoin !== undefined && {
        notifyOnMemberJoin: input.notifyOnMemberJoin,
      }),
      ...(input.notifyOnMemberLeave !== undefined && {
        notifyOnMemberLeave: input.notifyOnMemberLeave,
      }),
    },
  })

  return toTeamSettingsDto(settings)
}

/**
 * 팀의 모든 멤버 이메일을 조회합니다.
 * 팀 알림 발송 시 사용됩니다.
 *
 * @param teamId 팀 ID
 * @returns 멤버 이메일 배열
 */
export async function getTeamMemberEmails(teamId: string): Promise<string[]> {
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: {
        select: { email: true },
      },
    },
  })

  return members.map((m) => m.user.email)
}

/**
 * 팀 멤버들의 사용자 ID 목록을 조회합니다.
 * @param teamId 팀 ID
 * @returns 멤버 사용자 ID 배열
 */
export async function getTeamMemberIds(teamId: string): Promise<string[]> {
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    select: { userId: true },
  })

  return members.map((m) => m.userId)
}

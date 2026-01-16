/**
 * GitHub 타입 정의
 * Phase 34: GitHub Integration
 *
 * GitHub API 응답 타입, DTO, Zod 검증 스키마를 정의합니다.
 */

import { z } from 'zod/v4'

// ============================================================
// GitHub API 응답 타입
// ============================================================

/**
 * GitHub Repository 정보
 */
export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  private: boolean
  default_branch: string
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  pushed_at: string
  updated_at: string
}

/**
 * GitHub Commit 정보
 */
export interface GitHubCommit {
  sha: string
  message: string
  author: {
    name: string
    email: string
    date: string
  }
  committer: {
    name: string
    email: string
    date: string
  }
  html_url: string
}

/**
 * GitHub Workflow 정보
 */
export interface GitHubWorkflow {
  id: number
  name: string
  path: string
  state: 'active' | 'disabled_manually' | 'disabled_inactivity'
  html_url: string
}

/**
 * GitHub Workflow Run 정보
 */
export interface GitHubWorkflowRun {
  id: number
  name: string | null
  workflow_id: number
  status: 'queued' | 'in_progress' | 'completed' | 'waiting'
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null
  html_url: string
  created_at: string
  updated_at: string
  head_sha: string
  head_branch: string | null
}

/**
 * GitHub 사용자 정보 (토큰 검증 시 반환)
 */
export interface GitHubUser {
  login: string
  id: number
  avatar_url: string
  name: string | null
  email: string | null
}

// ============================================================
// DTO 타입
// ============================================================

/**
 * 클라이언트 반환용 GitHubSettings DTO
 * - accessToken 값은 절대 노출하지 않음
 * - hasToken boolean으로 토큰 유무만 표시
 */
export interface GitHubSettingsDto {
  id: string
  userId: string
  username: string | null
  avatarUrl: string | null
  hasToken: boolean // 토큰 유무만 노출, 값은 미노출
  tokenExpiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * GitHub 설정 생성 입력
 */
export interface CreateGitHubSettingsInput {
  accessToken: string
}

/**
 * 토큰 검증 결과
 */
export interface TokenValidationResult {
  valid: boolean
  username?: string
  avatarUrl?: string
  error?: string
}

// ============================================================
// Zod 검증 스키마
// ============================================================

/**
 * GitHub Personal Access Token 형식 검증
 * - Classic: ghp_로 시작
 * - Fine-grained: github_pat_로 시작
 */
const GITHUB_TOKEN_PATTERNS = [
  /^ghp_[a-zA-Z0-9]{36}$/, // Classic PAT
  /^github_pat_[a-zA-Z0-9_]{22,}$/, // Fine-grained PAT
] as const

/**
 * GitHub 설정 생성 입력 검증 스키마
 */
export const CreateGitHubSettingsSchema = z.object({
  accessToken: z
    .string()
    .min(1, 'Personal Access Token이 필요합니다')
    .refine(
      (token) =>
        GITHUB_TOKEN_PATTERNS.some((pattern) => pattern.test(token)),
      {
        message:
          '유효한 GitHub Personal Access Token 형식이 아닙니다 (ghp_ 또는 github_pat_ 접두사 필요)',
      }
    ),
})

export type CreateGitHubSettingsSchemaInput = z.infer<
  typeof CreateGitHubSettingsSchema
>

/**
 * Repository 필터 스키마
 */
export const RepositoryFilterSchema = z.object({
  type: z.enum(['all', 'owner', 'public', 'private', 'member']).optional(),
  sort: z.enum(['created', 'updated', 'pushed', 'full_name']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  per_page: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
})

export type RepositoryFilter = z.infer<typeof RepositoryFilterSchema>

/**
 * Commit 필터 스키마
 */
export const CommitFilterSchema = z.object({
  sha: z.string().optional(), // 특정 SHA부터
  path: z.string().optional(), // 특정 파일 경로
  author: z.string().optional(), // 특정 작성자
  since: z.string().datetime().optional(), // 시작 시간
  until: z.string().datetime().optional(), // 끝 시간
  per_page: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
})

export type CommitFilter = z.infer<typeof CommitFilterSchema>

/**
 * Workflow Run 필터 스키마
 */
export const WorkflowRunFilterSchema = z.object({
  actor: z.string().optional(), // 실행자
  branch: z.string().optional(), // 브랜치
  event: z.string().optional(), // 트리거 이벤트
  status: z
    .enum([
      'completed',
      'action_required',
      'cancelled',
      'failure',
      'neutral',
      'skipped',
      'stale',
      'success',
      'timed_out',
      'in_progress',
      'queued',
      'requested',
      'waiting',
      'pending',
    ])
    .optional(),
  per_page: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
})

export type WorkflowRunFilter = z.infer<typeof WorkflowRunFilterSchema>

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * GitHub 토큰이 Classic PAT인지 확인
 * @param token GitHub Personal Access Token
 * @returns Classic PAT 여부
 */
export function isClassicPAT(token: string): boolean {
  return /^ghp_[a-zA-Z0-9]{36}$/.test(token)
}

/**
 * GitHub 토큰이 Fine-grained PAT인지 확인
 * @param token GitHub Personal Access Token
 * @returns Fine-grained PAT 여부
 */
export function isFineGrainedPAT(token: string): boolean {
  return /^github_pat_[a-zA-Z0-9_]{22,}$/.test(token)
}

/**
 * GitHub 토큰이 유효한 형식인지 확인
 * @param token GitHub Personal Access Token
 * @returns 유효 여부
 */
export function isValidGitHubTokenFormat(token: string): boolean {
  return isClassicPAT(token) || isFineGrainedPAT(token)
}

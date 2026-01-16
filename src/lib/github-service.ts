/**
 * GitHub Service
 * GitHub API 연동 서비스 레이어
 *
 * Phase 34: GitHub Integration
 * - Octokit 기반 GitHub API 클라이언트
 * - 토큰 안전 관리 (로그/응답에 미노출)
 * - Settings CRUD
 * - Repository, Commit, Workflow 조회
 */

import { Octokit } from 'octokit'
import prisma from '@/lib/prisma'
import type {
  GitHubRepo,
  GitHubCommit,
  GitHubWorkflow,
  GitHubWorkflowRun,
  GitHubSettingsDto,
  CreateGitHubSettingsInput,
  TokenValidationResult,
  RepositoryFilter,
  CommitFilter,
  WorkflowRunFilter,
} from '@/types/github'

// ============================================================
// 타입 정의
// ============================================================

/**
 * Prisma GitHubSettings with User type
 */
type GitHubSettingsWithUser = {
  id: string
  userId: string
  accessToken: string
  tokenExpiresAt: Date | null
  username: string | null
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
}

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * Prisma GitHubSettings를 GitHubSettingsDto로 변환
 * - accessToken 값은 절대 포함하지 않음
 * - hasToken boolean만 노출
 *
 * @param settings Prisma GitHubSettings 엔티티
 * @returns GitHubSettingsDto
 */
function toGitHubSettingsDto(
  settings: GitHubSettingsWithUser
): GitHubSettingsDto {
  return {
    id: settings.id,
    userId: settings.userId,
    username: settings.username,
    avatarUrl: settings.avatarUrl,
    hasToken: !!settings.accessToken, // 토큰 값 미노출, 유무만 표시
    tokenExpiresAt: settings.tokenExpiresAt,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  }
}

// ============================================================
// Octokit 인스턴스 관리
// ============================================================

/**
 * 사용자의 토큰으로 Octokit 인스턴스를 생성합니다.
 *
 * @param userId 사용자 ID
 * @returns Octokit 인스턴스
 * @throws 토큰이 없으면 에러
 */
export async function getOctokitForUser(userId: string): Promise<Octokit> {
  const settings = await prisma.gitHubSettings.findUnique({
    where: { userId },
  })

  if (!settings) {
    throw new Error('GitHub 설정이 없습니다. 먼저 Personal Access Token을 등록해주세요.')
  }

  if (!settings.accessToken) {
    throw new Error('GitHub 토큰이 설정되지 않았습니다.')
  }

  // 토큰 만료 확인
  if (settings.tokenExpiresAt && settings.tokenExpiresAt < new Date()) {
    throw new Error('GitHub 토큰이 만료되었습니다. 새 토큰을 등록해주세요.')
  }

  return new Octokit({
    auth: settings.accessToken,
  })
}

// ============================================================
// Settings CRUD
// ============================================================

/**
 * 사용자의 GitHub 설정을 조회합니다.
 *
 * @param userId 사용자 ID
 * @returns GitHubSettingsDto 또는 null
 */
export async function getGitHubSettings(
  userId: string
): Promise<GitHubSettingsDto | null> {
  const settings = await prisma.gitHubSettings.findUnique({
    where: { userId },
  })

  if (!settings) {
    return null
  }

  return toGitHubSettingsDto(settings)
}

/**
 * GitHub 설정을 생성합니다.
 * 토큰 검증 후 유효한 경우에만 저장합니다.
 *
 * @param userId 사용자 ID
 * @param input 생성 입력 (accessToken)
 * @returns 생성된 GitHubSettingsDto
 * @throws 토큰이 유효하지 않거나 이미 설정이 있는 경우 에러
 */
export async function createGitHubSettings(
  userId: string,
  input: CreateGitHubSettingsInput
): Promise<GitHubSettingsDto> {
  // 기존 설정 확인
  const existing = await prisma.gitHubSettings.findUnique({
    where: { userId },
  })

  if (existing) {
    throw new Error('GitHub 설정이 이미 존재합니다. 삭제 후 다시 시도해주세요.')
  }

  // 토큰 검증
  const validation = await validateToken(input.accessToken)

  if (!validation.valid) {
    throw new Error(validation.error || '유효하지 않은 GitHub 토큰입니다.')
  }

  // 설정 생성
  const settings = await prisma.gitHubSettings.create({
    data: {
      userId,
      accessToken: input.accessToken,
      username: validation.username ?? null,
      avatarUrl: validation.avatarUrl ?? null,
    },
  })

  return toGitHubSettingsDto(settings)
}

/**
 * GitHub 설정을 업데이트합니다.
 * 새 토큰 검증 후 유효한 경우에만 업데이트합니다.
 *
 * @param userId 사용자 ID
 * @param input 업데이트 입력 (accessToken)
 * @returns 업데이트된 GitHubSettingsDto
 * @throws 토큰이 유효하지 않거나 설정이 없는 경우 에러
 */
export async function updateGitHubSettings(
  userId: string,
  input: CreateGitHubSettingsInput
): Promise<GitHubSettingsDto> {
  // 기존 설정 확인
  const existing = await prisma.gitHubSettings.findUnique({
    where: { userId },
  })

  if (!existing) {
    throw new Error('GitHub 설정이 없습니다.')
  }

  // 토큰 검증
  const validation = await validateToken(input.accessToken)

  if (!validation.valid) {
    throw new Error(validation.error || '유효하지 않은 GitHub 토큰입니다.')
  }

  // 설정 업데이트
  const settings = await prisma.gitHubSettings.update({
    where: { userId },
    data: {
      accessToken: input.accessToken,
      username: validation.username ?? null,
      avatarUrl: validation.avatarUrl ?? null,
    },
  })

  return toGitHubSettingsDto(settings)
}

/**
 * GitHub 설정을 삭제합니다.
 *
 * @param userId 사용자 ID
 * @throws 설정이 없으면 에러
 */
export async function deleteGitHubSettings(userId: string): Promise<void> {
  const existing = await prisma.gitHubSettings.findUnique({
    where: { userId },
  })

  if (!existing) {
    throw new Error('GitHub 설정이 없습니다.')
  }

  await prisma.gitHubSettings.delete({
    where: { userId },
  })
}

/**
 * GitHub 토큰의 유효성을 검증합니다.
 * 토큰으로 인증된 사용자 정보를 가져와 검증합니다.
 *
 * @param token GitHub Personal Access Token
 * @returns 검증 결과 (valid, username, avatarUrl, error)
 */
export async function validateToken(
  token: string
): Promise<TokenValidationResult> {
  try {
    const octokit = new Octokit({ auth: token })
    const { data } = await octokit.rest.users.getAuthenticated()

    return {
      valid: true,
      username: data.login,
      avatarUrl: data.avatar_url,
    }
  } catch (error) {
    // Rate limit 에러 처리
    if (
      error instanceof Error &&
      error.message.includes('rate limit')
    ) {
      return {
        valid: false,
        error: 'GitHub API rate limit에 도달했습니다. 잠시 후 다시 시도해주세요.',
      }
    }

    // 인증 에러 처리
    if (
      error instanceof Error &&
      (error.message.includes('Bad credentials') ||
        error.message.includes('401'))
    ) {
      return {
        valid: false,
        error: '유효하지 않은 GitHub 토큰입니다.',
      }
    }

    return {
      valid: false,
      error: 'GitHub 토큰 검증 중 오류가 발생했습니다.',
    }
  }
}

// ============================================================
// Repository 관련 함수
// ============================================================

/**
 * 사용자의 GitHub 레포지토리 목록을 조회합니다.
 *
 * @param userId 사용자 ID
 * @param filter 필터 옵션 (선택)
 * @returns GitHubRepo 배열
 * @throws 토큰이 없거나 API 에러 발생 시
 */
export async function getRepositories(
  userId: string,
  filter?: RepositoryFilter
): Promise<GitHubRepo[]> {
  const octokit = await getOctokitForUser(userId)

  try {
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      type: filter?.type,
      sort: filter?.sort,
      direction: filter?.direction,
      per_page: filter?.per_page ?? 30,
      page: filter?.page ?? 1,
    })

    return data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      private: repo.private,
      default_branch: repo.default_branch,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      open_issues_count: repo.open_issues_count,
      pushed_at: repo.pushed_at ?? '',
      updated_at: repo.updated_at ?? '',
    }))
  } catch (error) {
    handleGitHubApiError(error, 'Repository 목록 조회')
    throw error // 위 함수가 throw하지 않으면 여기서 throw
  }
}

/**
 * 특정 레포지토리 정보를 조회합니다.
 *
 * @param userId 사용자 ID
 * @param owner 레포지토리 소유자 (username 또는 org)
 * @param repo 레포지토리 이름
 * @returns GitHubRepo
 * @throws 레포지토리가 없거나 접근 권한이 없는 경우
 */
export async function getRepository(
  userId: string,
  owner: string,
  repo: string
): Promise<GitHubRepo> {
  const octokit = await getOctokitForUser(userId)

  try {
    const { data } = await octokit.rest.repos.get({
      owner,
      repo,
    })

    return {
      id: data.id,
      name: data.name,
      full_name: data.full_name,
      description: data.description,
      html_url: data.html_url,
      private: data.private,
      default_branch: data.default_branch,
      language: data.language,
      stargazers_count: data.stargazers_count,
      forks_count: data.forks_count,
      open_issues_count: data.open_issues_count,
      pushed_at: data.pushed_at ?? '',
      updated_at: data.updated_at ?? '',
    }
  } catch (error) {
    handleGitHubApiError(error, `Repository 조회 (${owner}/${repo})`)
    throw error
  }
}

// ============================================================
// Commit 관련 함수
// ============================================================

/**
 * 레포지토리의 커밋 목록을 조회합니다.
 *
 * @param userId 사용자 ID
 * @param owner 레포지토리 소유자
 * @param repo 레포지토리 이름
 * @param filter 필터 옵션 (선택)
 * @returns GitHubCommit 배열
 */
export async function getCommits(
  userId: string,
  owner: string,
  repo: string,
  filter?: CommitFilter
): Promise<GitHubCommit[]> {
  const octokit = await getOctokitForUser(userId)

  try {
    const { data } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      sha: filter?.sha,
      path: filter?.path,
      author: filter?.author,
      since: filter?.since,
      until: filter?.until,
      per_page: filter?.per_page ?? 30,
      page: filter?.page ?? 1,
    })

    return data.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author?.name ?? 'Unknown',
        email: commit.commit.author?.email ?? '',
        date: commit.commit.author?.date ?? '',
      },
      committer: {
        name: commit.commit.committer?.name ?? 'Unknown',
        email: commit.commit.committer?.email ?? '',
        date: commit.commit.committer?.date ?? '',
      },
      html_url: commit.html_url,
    }))
  } catch (error) {
    handleGitHubApiError(error, `Commit 목록 조회 (${owner}/${repo})`)
    throw error
  }
}

// ============================================================
// Workflow 관련 함수
// ============================================================

/**
 * 레포지토리의 워크플로우 목록을 조회합니다.
 *
 * @param userId 사용자 ID
 * @param owner 레포지토리 소유자
 * @param repo 레포지토리 이름
 * @returns GitHubWorkflow 배열
 */
export async function getWorkflows(
  userId: string,
  owner: string,
  repo: string
): Promise<GitHubWorkflow[]> {
  const octokit = await getOctokitForUser(userId)

  try {
    const { data } = await octokit.rest.actions.listRepoWorkflows({
      owner,
      repo,
    })

    return data.workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      path: workflow.path,
      state: workflow.state as GitHubWorkflow['state'],
      html_url: workflow.html_url,
    }))
  } catch (error) {
    handleGitHubApiError(error, `Workflow 목록 조회 (${owner}/${repo})`)
    throw error
  }
}

/**
 * 레포지토리의 워크플로우 실행 기록을 조회합니다.
 *
 * @param userId 사용자 ID
 * @param owner 레포지토리 소유자
 * @param repo 레포지토리 이름
 * @param workflowId 특정 워크플로우 ID (선택)
 * @param filter 필터 옵션 (선택)
 * @returns GitHubWorkflowRun 배열
 */
export async function getWorkflowRuns(
  userId: string,
  owner: string,
  repo: string,
  workflowId?: number,
  filter?: WorkflowRunFilter
): Promise<GitHubWorkflowRun[]> {
  const octokit = await getOctokitForUser(userId)

  try {
    let data: Awaited<
      ReturnType<typeof octokit.rest.actions.listWorkflowRunsForRepo>
    >['data']['workflow_runs']

    if (workflowId) {
      // 특정 워크플로우의 실행 기록
      const response = await octokit.rest.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: workflowId,
        actor: filter?.actor,
        branch: filter?.branch,
        event: filter?.event,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: filter?.status as any,
        per_page: filter?.per_page ?? 30,
        page: filter?.page ?? 1,
      })
      data = response.data.workflow_runs
    } else {
      // 모든 워크플로우 실행 기록
      const response = await octokit.rest.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        actor: filter?.actor,
        branch: filter?.branch,
        event: filter?.event,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: filter?.status as any,
        per_page: filter?.per_page ?? 30,
        page: filter?.page ?? 1,
      })
      data = response.data.workflow_runs
    }

    return data.map((run) => ({
      id: run.id,
      name: run.name ?? null,
      workflow_id: run.workflow_id,
      status: run.status as GitHubWorkflowRun['status'],
      conclusion: run.conclusion as GitHubWorkflowRun['conclusion'],
      html_url: run.html_url,
      created_at: run.created_at,
      updated_at: run.updated_at,
      head_sha: run.head_sha,
      head_branch: run.head_branch,
    }))
  } catch (error) {
    handleGitHubApiError(
      error,
      `Workflow Run 목록 조회 (${owner}/${repo}${workflowId ? `, workflow: ${workflowId}` : ''})`
    )
    throw error
  }
}

// ============================================================
// 에러 처리
// ============================================================

/**
 * GitHub API 에러를 처리합니다.
 *
 * @param error 에러 객체
 * @param operation 수행 중인 작업명 (로깅용)
 * @throws 적절한 에러 메시지와 함께 재throw
 */
function handleGitHubApiError(error: unknown, operation: string): never {
  // Rate limit 에러
  if (
    error instanceof Error &&
    error.message.includes('rate limit')
  ) {
    throw new Error(
      `GitHub API rate limit에 도달했습니다. 잠시 후 다시 시도해주세요. (${operation})`
    )
  }

  // 인증 에러
  if (
    error instanceof Error &&
    (error.message.includes('Bad credentials') ||
      error.message.includes('401'))
  ) {
    throw new Error(
      `GitHub 인증에 실패했습니다. 토큰을 확인해주세요. (${operation})`
    )
  }

  // 권한 에러
  if (
    error instanceof Error &&
    error.message.includes('403')
  ) {
    throw new Error(
      `GitHub 접근 권한이 없습니다. 토큰 권한을 확인해주세요. (${operation})`
    )
  }

  // 찾을 수 없음 에러
  if (
    error instanceof Error &&
    error.message.includes('404')
  ) {
    throw new Error(
      `리소스를 찾을 수 없습니다. (${operation})`
    )
  }

  // 일반 에러
  throw new Error(
    `GitHub API 오류가 발생했습니다. (${operation}): ${error instanceof Error ? error.message : '알 수 없는 오류'}`
  )
}

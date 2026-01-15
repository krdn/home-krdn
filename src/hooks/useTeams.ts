'use client';

/**
 * useTeams 훅
 *
 * 팀 관련 React Query 훅 모음
 * 팀 CRUD, 멤버 관리, 초대 관리 기능을 제공합니다.
 *
 * Phase 21: Team Features
 *
 * @example
 * ```tsx
 * const { teams, isLoading } = useMyTeams();
 * const createTeam = useCreateTeam();
 *
 * // 팀 생성
 * createTeam.mutate({ name: 'My Team', description: 'Description' });
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TeamDto, TeamMemberDto, TeamInviteDto, TeamSettingsDto } from '@/lib/team-service';

// ============================================================
// API 응답 타입
// ============================================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================
// API 함수
// ============================================================

/**
 * 현재 사용자의 팀 목록을 가져옵니다.
 */
async function fetchMyTeams(): Promise<ApiResponse<TeamDto[]>> {
  const response = await fetch('/api/teams', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      return { success: false, error: '로그인이 필요합니다' };
    }
    throw new Error('팀 목록을 가져오는데 실패했습니다');
  }

  return response.json();
}

/**
 * 팀 상세 정보를 가져옵니다.
 */
async function fetchTeam(teamId: string): Promise<ApiResponse<TeamDto>> {
  const response = await fetch(`/api/teams/${teamId}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '팀 정보를 가져오는데 실패했습니다');
  }

  return response.json();
}

/**
 * 팀 멤버 목록을 가져옵니다.
 */
async function fetchTeamMembers(teamId: string): Promise<ApiResponse<TeamMemberDto[]>> {
  const response = await fetch(`/api/teams/${teamId}/members`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '멤버 목록을 가져오는데 실패했습니다');
  }

  return response.json();
}

/**
 * 팀 초대 목록을 가져옵니다.
 */
async function fetchTeamInvites(teamId: string): Promise<ApiResponse<TeamInviteDto[]>> {
  const response = await fetch(`/api/teams/${teamId}/invites`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '초대 목록을 가져오는데 실패했습니다');
  }

  return response.json();
}

// ============================================================
// Query 훅
// ============================================================

/**
 * 현재 사용자의 팀 목록을 조회합니다.
 */
export function useMyTeams() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchMyTeams,
    staleTime: 2 * 60 * 1000, // 2분
  });

  return {
    teams: data?.success ? data.data : [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * 팀 상세 정보를 조회합니다.
 * @param teamId 팀 ID
 */
export function useTeam(teamId: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => fetchTeam(teamId!),
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000,
  });

  return {
    team: data?.success ? data.data : null,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * 팀 멤버 목록을 조회합니다.
 * @param teamId 팀 ID
 */
export function useTeamMembers(teamId: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => fetchTeamMembers(teamId!),
    enabled: !!teamId,
    staleTime: 1 * 60 * 1000, // 1분
  });

  return {
    members: data?.success ? data.data : [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * 팀 초대 목록을 조회합니다.
 * @param teamId 팀 ID
 */
export function useTeamInvites(teamId: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['team-invites', teamId],
    queryFn: () => fetchTeamInvites(teamId!),
    enabled: !!teamId,
    staleTime: 1 * 60 * 1000,
  });

  return {
    invites: data?.success ? data.data : [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// ============================================================
// Mutation 훅
// ============================================================

interface CreateTeamInput {
  name: string;
  description?: string;
}

interface UpdateTeamInput {
  name?: string;
  description?: string | null;
}

interface InviteMemberInput {
  email: string;
  role?: 'ADMIN' | 'USER' | 'VIEWER';
}

interface RemoveMemberInput {
  teamId: string;
  userId: string;
}

interface UpdateMemberRoleInput {
  teamId: string;
  userId: string;
  role: 'ADMIN' | 'USER' | 'VIEWER';
}

/**
 * 팀 생성 mutation
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTeamInput): Promise<ApiResponse<TeamDto>> => {
      const response = await fetch('/api/teams', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '팀 생성에 실패했습니다');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

/**
 * 팀 수정 mutation
 */
export function useUpdateTeam(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTeamInput): Promise<ApiResponse<TeamDto>> => {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '팀 수정에 실패했습니다');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
    },
  });
}

/**
 * 팀 삭제 mutation
 */
export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamId: string): Promise<ApiResponse<void>> => {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '팀 삭제에 실패했습니다');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

/**
 * 멤버 초대 mutation
 */
export function useInviteMember(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InviteMemberInput): Promise<ApiResponse<TeamInviteDto>> => {
      const response = await fetch(`/api/teams/${teamId}/invites`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '초대 발송에 실패했습니다');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invites', teamId] });
    },
  });
}

/**
 * 초대 취소 mutation
 */
export function useCancelInvite(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string): Promise<ApiResponse<void>> => {
      const response = await fetch(`/api/teams/${teamId}/invites?inviteId=${inviteId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '초대 취소에 실패했습니다');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invites', teamId] });
    },
  });
}

/**
 * 멤버 제거 mutation
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, userId }: RemoveMemberInput): Promise<ApiResponse<void>> => {
      const response = await fetch(`/api/teams/${teamId}/members?userId=${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '멤버 제거에 실패했습니다');
      }

      return response.json();
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
    },
  });
}

/**
 * 멤버 역할 변경 mutation
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, userId, role }: UpdateMemberRoleInput): Promise<ApiResponse<TeamMemberDto>> => {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '역할 변경에 실패했습니다');
      }

      return response.json();
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
  });
}

/**
 * 초대 수락 mutation
 */
export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string): Promise<ApiResponse<TeamMemberDto>> => {
      const response = await fetch(`/api/invites/${token}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '초대 수락에 실패했습니다');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

/**
 * 초대 정보 조회 (비로그인 상태에서도 가능)
 */
export function useInviteInfo(token: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['invite', token],
    queryFn: async (): Promise<ApiResponse<TeamInviteDto>> => {
      const response = await fetch(`/api/invites/${token}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '초대 정보를 가져오는데 실패했습니다');
      }

      return response.json();
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    invite: data?.success ? data.data : null,
    isLoading,
    error: error as Error | null,
  };
}

// ============================================================
// 팀 설정 훅 (Phase 21-04)
// ============================================================

interface UpdateTeamSettingsInput {
  emailNotifications?: boolean;
  slackWebhookUrl?: string | null;
  notifyOnAlert?: boolean;
  notifyOnMemberJoin?: boolean;
  notifyOnMemberLeave?: boolean;
}

/**
 * 팀 설정을 조회합니다.
 * @param teamId 팀 ID
 */
export function useTeamSettings(teamId: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['team-settings', teamId],
    queryFn: async (): Promise<ApiResponse<TeamSettingsDto>> => {
      const response = await fetch(`/api/teams/${teamId}/settings`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '팀 설정을 가져오는데 실패했습니다');
      }

      return response.json();
    },
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000,
  });

  return {
    settings: data?.success ? data.data : null,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * 팀 설정 업데이트 mutation
 */
export function useUpdateTeamSettings(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTeamSettingsInput): Promise<ApiResponse<TeamSettingsDto>> => {
      const response = await fetch(`/api/teams/${teamId}/settings`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '팀 설정 업데이트에 실패했습니다');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-settings', teamId] });
    },
  });
}

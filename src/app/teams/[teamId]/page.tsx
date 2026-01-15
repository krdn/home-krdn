'use client';

/**
 * 팀 상세 페이지
 *
 * 팀 정보, 멤버 목록, 초대 관리 기능을 제공합니다.
 *
 * Phase 21: Team Features
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Settings,
  UserPlus,
  Trash2,
  Calendar,
  Loader2,
  Edit2,
} from 'lucide-react';
import { useTeam, useTeamMembers, useDeleteTeam, useUpdateTeam } from '@/hooks/useTeams';
import { useAuth } from '@/hooks/useAuth';
import { TeamMemberList } from '@/components/teams/TeamMemberList';
import { InviteModal } from '@/components/teams/InviteModal';

/**
 * 날짜 포맷 함수
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const { user } = useAuth();
  const { team, isLoading: teamLoading, error: teamError } = useTeam(teamId);
  const { members, isLoading: membersLoading } = useTeamMembers(teamId);
  const deleteTeam = useDeleteTeam();
  const updateTeam = useUpdateTeam(teamId);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // 현재 사용자 정보
  const currentUserId = user?.id || '';
  const isOwner = team?.ownerId === currentUserId;
  const currentMember = members?.find((m) => m.userId === currentUserId);
  const isAdmin = isOwner || currentMember?.role === 'ADMIN';

  // 팀 삭제
  const handleDelete = async () => {
    if (!confirm('정말 이 팀을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      await deleteTeam.mutateAsync(teamId);
      router.push('/teams');
    } catch (error) {
      alert(error instanceof Error ? error.message : '팀 삭제에 실패했습니다');
    }
  };

  // 팀 수정 시작
  const startEdit = () => {
    if (!team) return;
    setEditName(team.name);
    setEditDescription(team.description || '');
    setEditMode(true);
  };

  // 팀 수정 저장
  const saveEdit = async () => {
    if (!editName.trim()) return;

    try {
      await updateTeam.mutateAsync({
        name: editName.trim(),
        description: editDescription.trim() || null,
      });
      setEditMode(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : '팀 수정에 실패했습니다');
    }
  };

  // 로딩 상태
  if (teamLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // 에러 상태
  if (teamError || !team) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/teams"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>팀 목록으로</span>
        </Link>
        <div className="text-center py-16">
          <p className="text-destructive">{teamError?.message || '팀을 찾을 수 없습니다'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 뒤로가기 */}
      <Link
        href="/teams"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>팀 목록으로</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* 팀 정보 헤더 */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editMode ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-2xl font-bold w-full px-3 py-1 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    maxLength={50}
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="팀 설명 (선택)"
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
                    rows={2}
                    maxLength={200}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      disabled={updateTeam.isPending}
                      className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
                    >
                      {updateTeam.isPending ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-4 py-1.5 text-muted-foreground hover:bg-muted rounded-md text-sm"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{team.name}</h1>
                    {isOwner && (
                      <button
                        onClick={startEdit}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                        title="팀 정보 수정"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {team.description && (
                    <p className="text-muted-foreground mt-2">{team.description}</p>
                  )}
                </>
              )}

              {/* 메타 정보 */}
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{team.memberCount}명</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(team.createdAt)}</span>
                </div>
                <div>
                  소유자: <span className="font-medium text-foreground">{team.ownerUsername}</span>
                </div>
              </div>
            </div>

            {/* 액션 버튼들 */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>멤버 초대</span>
                </button>

                {isOwner && (
                  <button
                    onClick={handleDelete}
                    disabled={deleteTeam.isPending}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="팀 삭제"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 멤버 섹션 */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            팀 멤버
          </h2>

          {membersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <TeamMemberList
              teamId={teamId}
              members={members || []}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              ownerId={team.ownerId}
            />
          )}
        </div>
      </motion.div>

      {/* 초대 모달 */}
      <InviteModal
        teamId={teamId}
        teamName={team.name}
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </div>
  );
}

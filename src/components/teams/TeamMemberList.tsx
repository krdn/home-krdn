'use client';

/**
 * TeamMemberList 컴포넌트
 *
 * 팀 멤버 목록을 표시하고 관리하는 컴포넌트
 * 역할 변경 및 멤버 제거 기능 포함 (관리자 전용)
 *
 * Phase 21: Team Features
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle, ChevronDown, Trash2, Shield, User, Eye } from 'lucide-react';
import { useRemoveMember, useUpdateMemberRole } from '@/hooks/useTeams';
import type { TeamMemberDto } from '@/lib/team-service';

interface TeamMemberListProps {
  teamId: string;
  members: TeamMemberDto[];
  currentUserId: string;
  isAdmin: boolean;
  ownerId: string;
}

// 역할 라벨 및 아이콘 매핑
const roleConfig = {
  ADMIN: { label: '관리자', icon: Shield, color: 'text-primary' },
  USER: { label: '멤버', icon: User, color: 'text-foreground' },
  VIEWER: { label: '뷰어', icon: Eye, color: 'text-muted-foreground' },
} as const;

/**
 * 날짜 포맷 함수
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function TeamMemberList({
  teamId,
  members,
  currentUserId,
  isAdmin,
  ownerId,
}: TeamMemberListProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const removeMember = useRemoveMember();
  const updateRole = useUpdateMemberRole();

  const handleRemove = async (userId: string) => {
    if (!confirm('정말 이 멤버를 제거하시겠습니까?')) return;

    try {
      await removeMember.mutateAsync({ teamId, userId });
    } catch (error) {
      alert(error instanceof Error ? error.message : '멤버 제거에 실패했습니다');
    }
  };

  const handleRoleChange = async (userId: string, role: 'ADMIN' | 'USER' | 'VIEWER') => {
    try {
      await updateRole.mutateAsync({ teamId, userId, role });
      setOpenDropdown(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : '역할 변경에 실패했습니다');
    }
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        팀 멤버가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {members.map((member) => {
          const isOwner = member.userId === ownerId;
          const isSelf = member.userId === currentUserId;
          const canManage = isAdmin && !isOwner && !isSelf;
          const roleInfo = roleConfig[member.role];
          const RoleIcon = roleInfo.icon;

          return (
            <motion.div
              key={member.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center justify-between p-3 rounded-lg bg-surface/50 border border-border"
            >
              {/* 멤버 정보 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {member.displayName || member.username}
                    </span>
                    {isOwner && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        소유자
                      </span>
                    )}
                    {isSelf && (
                      <span className="text-xs bg-accent/10 text-accent-foreground px-2 py-0.5 rounded-full">
                        나
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>@{member.username}</span>
                    <span>•</span>
                    <span>{formatDate(member.joinedAt)}</span>
                  </div>
                </div>
              </div>

              {/* 역할 및 액션 */}
              <div className="flex items-center gap-2">
                {/* 역할 표시/드롭다운 */}
                <div className="relative">
                  <button
                    onClick={() => canManage && setOpenDropdown(openDropdown === member.id ? null : member.id)}
                    disabled={!canManage}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                      canManage
                        ? 'bg-secondary hover:bg-secondary/80 cursor-pointer'
                        : 'bg-muted/50 cursor-default'
                    } ${roleInfo.color}`}
                  >
                    <RoleIcon className="w-3.5 h-3.5" />
                    <span>{roleInfo.label}</span>
                    {canManage && <ChevronDown className="w-3.5 h-3.5 ml-1" />}
                  </button>

                  {/* 역할 변경 드롭다운 */}
                  <AnimatePresence>
                    {openDropdown === member.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-1 z-10 bg-popover border border-border rounded-md shadow-lg overflow-hidden min-w-[120px]"
                      >
                        {(Object.keys(roleConfig) as Array<keyof typeof roleConfig>).map((role) => {
                          const config = roleConfig[role];
                          const Icon = config.icon;
                          return (
                            <button
                              key={role}
                              onClick={() => handleRoleChange(member.userId, role)}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors ${
                                member.role === role ? 'bg-accent/50' : ''
                              }`}
                            >
                              <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                              <span>{config.label}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 멤버 제거 버튼 */}
                {canManage && (
                  <button
                    onClick={() => handleRemove(member.userId)}
                    disabled={removeMember.isPending}
                    className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    title="멤버 제거"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* 자기 자신 탈퇴 버튼 */}
                {isSelf && !isOwner && (
                  <button
                    onClick={() => handleRemove(member.userId)}
                    disabled={removeMember.isPending}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    탈퇴
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

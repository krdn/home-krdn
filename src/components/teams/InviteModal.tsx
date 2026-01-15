'use client';

/**
 * InviteModal 컴포넌트
 *
 * 팀 멤버 초대 모달
 * 이메일 입력, 역할 선택, 대기 중인 초대 목록 표시
 *
 * Phase 21: Team Features
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Send, Trash2, Clock, Copy, Check } from 'lucide-react';
import { useTeamInvites, useInviteMember, useCancelInvite } from '@/hooks/useTeams';
import type { TeamInviteDto } from '@/lib/team-service';

interface InviteModalProps {
  teamId: string;
  teamName: string;
  isOpen: boolean;
  onClose: () => void;
}

// 역할 옵션
const roleOptions = [
  { value: 'VIEWER', label: '뷰어', description: '읽기만 가능' },
  { value: 'USER', label: '멤버', description: '기본 권한' },
  { value: 'ADMIN', label: '관리자', description: '팀 관리 가능' },
] as const;

/**
 * 만료 시간 포맷
 */
function formatExpiry(date: Date): string {
  const expiry = new Date(date);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return '만료됨';
  if (diffDays === 1) return '1일 남음';
  return `${diffDays}일 남음`;
}

export function InviteModal({ teamId, teamName, isOpen, onClose }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'USER' | 'VIEWER'>('USER');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const { invites, isLoading: invitesLoading } = useTeamInvites(teamId);
  const inviteMember = useInviteMember(teamId);
  const cancelInvite = useCancelInvite(teamId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await inviteMember.mutateAsync({ email: email.trim(), role });
      setEmail('');
      setRole('USER');
    } catch (error) {
      alert(error instanceof Error ? error.message : '초대 발송에 실패했습니다');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm('초대를 취소하시겠습니까?')) return;

    try {
      await cancelInvite.mutateAsync(inviteId);
    } catch (error) {
      alert(error instanceof Error ? error.message : '초대 취소에 실패했습니다');
    }
  };

  const handleCopyLink = async (invite: TeamInviteDto) => {
    const link = `${window.location.origin}/teams/invite/${invite.token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(invite.id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-md bg-background border border-border rounded-xl shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold">멤버 초대</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-muted rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 초대 폼 */}
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{teamName}</span>에 새 멤버를 초대합니다.
                </p>

                {/* 이메일 입력 */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                    이메일 주소
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                </div>

                {/* 역할 선택 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">역할</label>
                  <div className="grid grid-cols-3 gap-2">
                    {roleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRole(option.value)}
                        className={`p-2 text-center rounded-md border transition-colors ${
                          role === option.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-input hover:border-primary/50'
                        }`}
                      >
                        <div className="text-sm font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 제출 버튼 */}
                <button
                  type="submit"
                  disabled={inviteMember.isPending || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>{inviteMember.isPending ? '발송 중...' : '초대 발송'}</span>
                </button>
              </form>

              {/* 대기 중인 초대 목록 */}
              <div className="border-t border-border p-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  대기 중인 초대 ({invites?.length || 0})
                </h3>

                {invitesLoading ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    로딩 중...
                  </div>
                ) : invites && invites.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-2 bg-surface/50 rounded-md"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{invite.email}</div>
                          <div className="text-xs text-muted-foreground">
                            {roleOptions.find((r) => r.value === invite.role)?.label} • {formatExpiry(invite.expiresAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {/* 링크 복사 */}
                          <button
                            onClick={() => handleCopyLink(invite)}
                            className="p-1.5 hover:bg-muted rounded-md transition-colors"
                            title="초대 링크 복사"
                          >
                            {copiedToken === invite.id ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                          {/* 취소 */}
                          <button
                            onClick={() => handleCancelInvite(invite.id)}
                            disabled={cancelInvite.isPending}
                            className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            title="초대 취소"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    대기 중인 초대가 없습니다.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

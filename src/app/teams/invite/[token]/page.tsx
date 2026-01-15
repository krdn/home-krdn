'use client';

/**
 * 팀 초대 수락 페이지
 *
 * 초대 링크를 통해 접근하여 팀에 가입하는 페이지
 *
 * Phase 21: Team Features
 */

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useInviteInfo, useAcceptInvite } from '@/hooks/useTeams';
import { useAuth } from '@/hooks/useAuth';

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const { user, isLoading: authLoading } = useAuth();
  const { invite, isLoading: inviteLoading, error: inviteError } = useInviteInfo(token);
  const acceptInvite = useAcceptInvite();

  const isLoading = authLoading || inviteLoading;

  const handleAccept = async () => {
    if (!user) {
      // 로그인 페이지로 리다이렉트 (초대 토큰 유지)
      router.push(`/login?redirect=/teams/invite/${token}`);
      return;
    }

    try {
      await acceptInvite.mutateAsync(token);
      router.push(`/teams/${invite?.teamId}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : '초대 수락에 실패했습니다');
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 에러 상태 (유효하지 않은 초대)
  if (inviteError || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold mb-2">유효하지 않은 초대</h1>
          <p className="text-muted-foreground mb-6">
            {inviteError?.message || '이 초대 링크는 만료되었거나 이미 사용되었습니다.'}
          </p>
          <Link
            href="/teams"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <span>팀 목록으로</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  // 수락 성공 후
  if (acceptInvite.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-xl font-bold mb-2">팀에 가입했습니다!</h1>
          <p className="text-muted-foreground mb-6">
            <span className="font-medium text-foreground">{invite.teamName}</span>의 멤버가 되었습니다.
          </p>
          <Link
            href={`/teams/${invite.teamId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <span>팀으로 이동</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  // 초대 정보 표시
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-card border border-border rounded-xl p-8"
      >
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold">팀 초대</h1>
          <p className="text-muted-foreground mt-1">
            팀에 초대되었습니다
          </p>
        </div>

        {/* 초대 정보 */}
        <div className="bg-surface/50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">팀 이름</span>
            <span className="font-medium">{invite.teamName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">초대자</span>
            <span className="font-medium">{invite.invitedByUsername}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">부여 역할</span>
            <span className="font-medium">
              {invite.role === 'ADMIN' ? '관리자' : invite.role === 'USER' ? '멤버' : '뷰어'}
            </span>
          </div>
        </div>

        {/* 액션 */}
        {user ? (
          <button
            onClick={handleAccept}
            disabled={acceptInvite.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {acceptInvite.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>가입 중...</span>
              </>
            ) : (
              <>
                <span>초대 수락</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              초대를 수락하려면 로그인이 필요합니다
            </p>
            <button
              onClick={handleAccept}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <span>로그인하고 수락하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

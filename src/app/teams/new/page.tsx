'use client';

/**
 * 팀 생성 페이지
 *
 * 새 팀을 생성하는 폼 페이지
 *
 * Phase 21: Team Features
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';
import { useCreateTeam } from '@/hooks/useTeams';

export default function NewTeamPage() {
  const router = useRouter();
  const createTeam = useCreateTeam();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const result = await createTeam.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (result.success && result.data) {
        router.push(`/teams/${result.data.id}`);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '팀 생성에 실패했습니다');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
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
        className="bg-card border border-border rounded-xl p-6"
      >
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">새 팀 만들기</h1>
          <p className="text-sm text-muted-foreground mt-1">
            팀을 만들고 멤버들을 초대하세요
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 팀 이름 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1.5">
              팀 이름 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 개발팀"
              maxLength={50}
              className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              2~50자 사이로 입력해주세요
            </p>
          </div>

          {/* 팀 설명 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1.5">
              팀 설명 <span className="text-muted-foreground">(선택)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="팀에 대한 간단한 설명을 입력하세요"
              maxLength={200}
              rows={3}
              className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              최대 200자
            </p>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={createTeam.isPending || !name.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createTeam.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>생성 중...</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                <span>팀 생성하기</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

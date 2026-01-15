'use client';

/**
 * 팀 목록 페이지
 *
 * 현재 사용자가 속한 팀 목록을 표시합니다.
 *
 * Phase 21: Team Features
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, Plus } from 'lucide-react';
import { useMyTeams } from '@/hooks/useTeams';
import { TeamCard } from '@/components/teams/TeamCard';

export default function TeamsPage() {
  const { teams, isLoading, error } = useMyTeams();

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            내 팀
          </h1>
          <p className="text-muted-foreground mt-1">
            팀을 만들고 멤버들과 협업하세요
          </p>
        </div>

        {/* 새 팀 만들기 버튼 */}
        <Link
          href="/teams/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>새 팀 만들기</span>
        </Link>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 rounded-lg bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="text-center py-12">
          <p className="text-destructive">{error.message}</p>
        </div>
      )}

      {/* 팀 목록 */}
      {!isLoading && !error && teams && teams.length > 0 && (
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </motion.div>
      )}

      {/* 빈 상태 */}
      {!isLoading && !error && (!teams || teams.length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">아직 팀이 없습니다</h2>
          <p className="text-muted-foreground mb-6">
            새 팀을 만들어 멤버들과 협업을 시작하세요
          </p>
          <Link
            href="/teams/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>첫 팀 만들기</span>
          </Link>
        </motion.div>
      )}
    </div>
  );
}

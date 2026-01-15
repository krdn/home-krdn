'use client';

/**
 * TeamCard 컴포넌트
 *
 * 팀 목록에서 개별 팀을 표시하는 카드 컴포넌트
 *
 * Phase 21: Team Features
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, Calendar } from 'lucide-react';
import type { TeamDto } from '@/lib/team-service';

interface TeamCardProps {
  team: TeamDto;
}

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

export function TeamCard({ team }: TeamCardProps) {
  return (
    <Link href={`/teams/${team.id}`}>
      <motion.div
        className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-accent/5"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* 팀 이름 */}
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {team.name}
        </h3>

        {/* 팀 설명 */}
        {team.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {team.description}
          </p>
        )}

        {/* 메타 정보 */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          {/* 멤버 수 */}
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{team.memberCount}명</span>
          </div>

          {/* 생성일 */}
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(team.createdAt)}</span>
          </div>
        </div>

        {/* 소유자 표시 */}
        <div className="mt-3 text-xs text-muted-foreground">
          소유자: <span className="font-medium text-foreground">{team.ownerUsername}</span>
        </div>

        {/* 호버 인디케이터 */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg
            className="h-5 w-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </motion.div>
    </Link>
  );
}

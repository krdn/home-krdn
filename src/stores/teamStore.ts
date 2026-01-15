/**
 * Team Store
 *
 * 팀 관련 전역 상태 관리 (Zustand)
 * 현재 선택된 팀 ID를 관리합니다.
 *
 * Phase 21: Team Features
 *
 * @example
 * ```tsx
 * const { currentTeamId, setCurrentTeam, clearCurrentTeam } = useTeamStore();
 *
 * // 팀 선택
 * setCurrentTeam('team-id');
 *
 * // 선택 해제
 * clearCurrentTeam();
 * ```
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================
// 스토어 타입
// ============================================================

interface TeamStoreState {
  /** 현재 선택된 팀 ID */
  currentTeamId: string | null;

  /** 팀 선택 */
  setCurrentTeam: (teamId: string) => void;

  /** 팀 선택 해제 */
  clearCurrentTeam: () => void;
}

// ============================================================
// 스토어 생성
// ============================================================

/**
 * 팀 Zustand 스토어
 *
 * localStorage에 persist하여 새로고침 시에도 선택된 팀 유지
 */
export const useTeamStore = create<TeamStoreState>()(
  persist(
    (set) => ({
      currentTeamId: null,

      setCurrentTeam: (teamId: string) => {
        set({ currentTeamId: teamId });
      },

      clearCurrentTeam: () => {
        set({ currentTeamId: null });
      },
    }),
    {
      name: 'team-storage', // localStorage 키
      partialize: (state) => ({
        currentTeamId: state.currentTeamId,
      }),
    }
  )
);

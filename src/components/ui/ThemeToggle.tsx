"use client";

/**
 * 테마 토글 컴포넌트
 *
 * Dark/Light 모드 전환 버튼입니다.
 * 로그인 상태일 때는 서버에 테마 설정을 동기화합니다.
 * 비로그인 상태에서도 localStorage를 통해 로컬 테마 변경이 가능합니다.
 *
 * Phase 20: User Dashboard Settings - 서버 동기화 기능 추가
 */

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "./Button";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<"dark" | "light">("dark");
  const [initialized, setInitialized] = React.useState(false);

  // 인증 및 설정 훅 (훅은 항상 호출, 조건부 사용)
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { settings, updateSettings, isLoading: settingsLoading } = useSettings();

  // 테마 적용 함수
  const applyTheme = React.useCallback((newTheme: "dark" | "light") => {
    setTheme(newTheme);
    document.documentElement.classList.toggle("light", newTheme === "light");
    localStorage.setItem("theme", newTheme);
  }, []);

  // 초기 테마 설정
  React.useEffect(() => {
    // 인증 로딩 중이면 대기
    if (authLoading) return;

    // 이미 초기화된 경우 스킵
    if (initialized) return;

    // 로그인 상태이고 설정 로딩이 완료된 경우
    if (isAuthenticated && !settingsLoading && settings) {
      // 서버 설정 값 적용
      applyTheme(settings.theme);
      setInitialized(true);
      return;
    }

    // 비로그인 상태이거나 설정이 없는 경우: localStorage 사용
    if (!isAuthenticated) {
      const stored = localStorage.getItem("theme") as "dark" | "light" | null;
      if (stored) {
        applyTheme(stored);
      }
      setInitialized(true);
    }
  }, [authLoading, isAuthenticated, settingsLoading, settings, initialized, applyTheme]);

  // 서버 설정 변경 감지 시 로컬 테마 동기화
  React.useEffect(() => {
    if (isAuthenticated && settings && initialized) {
      // 서버 값과 로컬 값이 다르면 서버 값으로 업데이트
      if (settings.theme !== theme) {
        applyTheme(settings.theme);
      }
    }
  }, [settings?.theme, isAuthenticated, initialized, theme, applyTheme]);

  // 테마 토글 핸들러
  const toggleTheme = React.useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";

    // 로컬 테마 즉시 적용 (반응성 보장)
    applyTheme(newTheme);

    // 로그인 상태면 서버에 저장 (best-effort)
    if (isAuthenticated) {
      updateSettings({ theme: newTheme });
    }
  }, [theme, isAuthenticated, updateSettings, applyTheme]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}

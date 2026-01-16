"use client";

/**
 * AuthButton 컴포넌트
 *
 * Header에 표시되는 인증 버튼입니다.
 * - 미인증: 로그인 버튼 표시
 * - 인증됨: 사용자명 + 로그아웃 버튼 표시
 *
 * Phase 33: 인증 UI 통합
 */

import { useState } from "react";
import { User, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "./LoginModal";

export function AuthButton() {
  const { user, isAuthenticated, isLoading, refetch } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 로그아웃 처리
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        // 세션 새로고침
        refetch();
      }
    } catch (error) {
      console.error("로그아웃 실패:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // 로그인 성공 콜백
  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    refetch();
  };

  // 로딩 중
  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">로딩 중</span>
      </Button>
    );
  }

  // 인증된 상태
  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2">
        {/* 사용자 정보 */}
        <div className="hidden items-center gap-2 sm:flex">
          <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium">{user.username}</span>
          {user.role === "admin" && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Admin
            </span>
          )}
        </div>

        {/* 로그아웃 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          loading={isLoggingOut}
          aria-label="로그아웃"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">로그아웃</span>
        </Button>
      </div>
    );
  }

  // 미인증 상태
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowLoginModal(true)}
        aria-label="로그인"
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">로그인</span>
      </Button>

      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}

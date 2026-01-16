"use client";

/**
 * LoginModal 컴포넌트
 *
 * 로그인 폼을 포함한 모달 다이얼로그입니다.
 * Radix UI Dialog를 사용합니다.
 *
 * Phase 33: 인증 UI 통합
 */

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LoginModal({ open, onOpenChange, onSuccess }: LoginModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 모달이 닫힐 때 폼 초기화
  useEffect(() => {
    if (!open) {
      setUsername("");
      setPassword("");
      setError(null);
    }
  }, [open]);

  // 로그인 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "로그인에 실패했습니다");
      }

      // 성공
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* 오버레이 */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* 모달 컨텐츠 */}
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-lg border bg-background p-6 shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          )}
        >
          {/* 헤더 */}
          <Dialog.Title className="text-lg font-semibold">로그인</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            계정 정보를 입력하여 로그인하세요.
          </Dialog.Description>

          {/* 닫기 버튼 */}
          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* 에러 메시지 */}
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 사용자명 */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium leading-none"
              >
                사용자명
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="사용자명을 입력하세요"
                autoComplete="username"
                required
                disabled={isLoading}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "ring-offset-background placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
            </div>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none"
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                required
                disabled={isLoading}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "ring-offset-background placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
            </div>

            {/* 제출 버튼 */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !username || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                "로그인"
              )}
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

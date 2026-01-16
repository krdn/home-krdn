'use client';

/**
 * GitHubSetup 컴포넌트
 *
 * GitHub 토큰 설정 및 계정 정보 표시 컴포넌트
 * - 토큰 미등록: Personal Access Token 입력 폼
 * - 토큰 등록됨: GitHub 계정 정보 + 연동 해제 버튼
 *
 * Phase 35: CI/CD Dashboard
 */

import { useState, useCallback } from 'react';
import Image from 'next/image';
import {
  Github,
  User,
  Trash2,
  Check,
  AlertCircle,
  Key,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useGitHubSettings, useGitHubSettingsMutation } from '@/hooks/useGitHub';

// ============================================================
// Props
// ============================================================

interface GitHubSetupProps {
  /** 설정 변경 시 콜백 */
  onSettingsChange?: () => void;
}

// ============================================================
// 컴포넌트
// ============================================================

export function GitHubSetup({ onSettingsChange }: GitHubSetupProps) {
  // GitHub 설정 조회
  const { settings, hasToken, isLoading, error, refetch } = useGitHubSettings();
  const { saveSettings, deleteSettings } = useGitHubSettingsMutation();

  // 토큰 입력 상태
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // 토큰 형식 검증
  const validateTokenFormat = useCallback((token: string): boolean => {
    // Classic PAT: ghp_로 시작
    // Fine-grained PAT: github_pat_로 시작
    return /^ghp_[a-zA-Z0-9]{36}$/.test(token) || /^github_pat_[a-zA-Z0-9_]{22,}$/.test(token);
  }, []);

  // 토큰 등록 핸들러
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setTokenError(null);

      const token = tokenInput.trim();

      // 형식 검증
      if (!validateTokenFormat(token)) {
        setTokenError('유효한 GitHub Personal Access Token 형식이 아닙니다 (ghp_ 또는 github_pat_ 접두사 필요)');
        return;
      }

      try {
        await saveSettings.mutateAsync({ accessToken: token });
        setTokenInput('');
        onSettingsChange?.();
      } catch (err) {
        setTokenError(err instanceof Error ? err.message : '토큰 등록에 실패했습니다');
      }
    },
    [tokenInput, validateTokenFormat, saveSettings, onSettingsChange]
  );

  // 연동 해제 핸들러
  const handleDelete = useCallback(async () => {
    try {
      await deleteSettings.mutateAsync();
      setShowConfirmDelete(false);
      onSettingsChange?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : '연동 해제에 실패했습니다');
    }
  }, [deleteSettings, onSettingsChange]);

  // 로딩 상태
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <p className="mb-2 font-medium">GitHub 설정을 불러오지 못했습니다</p>
          <p className="mb-4 text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 토큰 등록됨: 계정 정보 표시
  if (hasToken && settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub 연동됨
          </CardTitle>
          <CardDescription>
            GitHub 계정이 연동되어 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 계정 정보 */}
          <div className="flex items-center gap-4 rounded-lg border p-4">
            {/* 아바타 */}
            <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted">
              {settings.avatarUrl ? (
                <Image
                  src={settings.avatarUrl}
                  alt={settings.username || 'GitHub Avatar'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* 사용자 정보 */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{settings.username || 'Unknown User'}</p>
                <Badge variant="success">
                  <Check className="mr-1 h-3 w-3" />
                  연동됨
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Key className="h-3 w-3" />
                <span>토큰 등록됨</span>
                {settings.tokenExpiresAt && (
                  <span className="text-warning">
                    (만료: {new Date(settings.tokenExpiresAt).toLocaleDateString()})
                  </span>
                )}
              </div>
            </div>

            {/* GitHub 프로필 링크 */}
            {settings.username && (
              <a
                href={`https://github.com/${settings.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                title="GitHub 프로필 보기"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            )}
          </div>

          {/* 연동 해제 버튼 */}
          {showConfirmDelete ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="flex-1 text-sm">
                정말 GitHub 연동을 해제하시겠습니까? 레포지토리, 워크플로우 정보에 접근할 수 없게 됩니다.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfirmDelete(false)}
                  disabled={deleteSettings.isPending}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  loading={deleteSettings.isPending}
                >
                  해제
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => setShowConfirmDelete(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              GitHub 연동 해제
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // 토큰 미등록: 입력 폼 표시
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          GitHub 연동
        </CardTitle>
        <CardDescription>
          GitHub Personal Access Token을 등록하여 레포지토리, 워크플로우 정보에 접근하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 토큰 입력 */}
          <div className="space-y-2">
            <label htmlFor="github-token" className="text-sm font-medium">
              Personal Access Token
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="github-token"
                type="password"
                placeholder="ghp_... 또는 github_pat_..."
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value);
                  setTokenError(null);
                }}
                className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                autoComplete="off"
              />
            </div>
            {tokenError && (
              <p className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="h-3 w-3" />
                {tokenError}
              </p>
            )}
          </div>

          {/* 안내 */}
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <p className="mb-2 font-medium">토큰 생성 방법:</p>
            <ol className="ml-4 list-decimal space-y-1">
              <li>
                <a
                  href="https://github.com/settings/tokens?type=beta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  GitHub Settings &gt; Developer settings &gt; Personal access tokens
                </a>
              </li>
              <li>Fine-grained 또는 Classic 토큰 생성</li>
              <li>
                필요 권한: <code className="rounded bg-muted px-1">repo</code>,{' '}
                <code className="rounded bg-muted px-1">workflow</code> (읽기)
              </li>
            </ol>
          </div>

          {/* 등록 버튼 */}
          <Button
            type="submit"
            className="w-full"
            loading={saveSettings.isPending}
            disabled={!tokenInput.trim()}
          >
            <Github className="mr-2 h-4 w-4" />
            토큰 등록
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

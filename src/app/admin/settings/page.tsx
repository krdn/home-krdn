'use client';

/**
 * 사용자 설정 페이지
 *
 * 테마, 알림 설정을 관리합니다.
 * 설정은 서버에 저장되어 다른 기기에서도 동일하게 적용됩니다.
 *
 * Phase 20: User Dashboard Settings
 */

import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card';
import { Settings, Moon, Sun, Bell, Mail, Loader2 } from 'lucide-react';

/**
 * 토글 스위치 컴포넌트
 */
function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-label={label}
      aria-checked={checked}
      role="switch"
      className={`relative h-6 w-11 rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-muted'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}

/**
 * 로딩 스피너
 */
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

/**
 * 에러 메시지
 */
function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
      {message}
    </div>
  );
}

/**
 * 로그인 필요 메시지
 */
function LoginRequired() {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center">
      <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">로그인이 필요합니다</h3>
      <p className="text-muted-foreground">
        설정을 변경하려면 먼저 로그인해 주세요.
      </p>
    </div>
  );
}

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    settings,
    isLoading: settingsLoading,
    error,
    updateSettings,
    isUpdating,
  } = useSettings();

  // 테마 변경 핸들러
  const handleThemeChange = (theme: 'dark' | 'light') => {
    updateSettings({ theme });
    // 즉시 로컬 테마도 변경
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('theme', theme);
  };

  // 알림 설정 변경 핸들러
  const handleEmailNotificationsChange = (enabled: boolean) => {
    updateSettings({ emailNotifications: enabled });
  };

  const handlePushNotificationsChange = (enabled: boolean) => {
    updateSettings({ pushNotifications: enabled });
  };

  // 로딩 상태
  if (authLoading || settingsLoading) {
    return (
      <div className="container max-w-2xl py-8">
        <LoadingSpinner />
      </div>
    );
  }

  // 미인증 상태
  if (!isAuthenticated) {
    return (
      <div className="container max-w-2xl py-8">
        <LoginRequired />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="container max-w-2xl py-8">
        <ErrorMessage message={error.message} />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">설정</h1>
          <p className="text-muted-foreground">
            대시보드 환경을 설정합니다
          </p>
        </div>
      </div>

      {/* 테마 설정 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {settings?.theme === 'dark' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            테마 설정
          </CardTitle>
          <CardDescription>
            대시보드의 색상 테마를 선택합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 테마 선택 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={() => handleThemeChange('dark')}
              disabled={isUpdating}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                settings?.theme === 'dark'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-muted-foreground'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Moon className="h-5 w-5" />
              <span className="font-medium">다크</span>
            </button>
            <button
              onClick={() => handleThemeChange('light')}
              disabled={isUpdating}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                settings?.theme === 'light'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-muted-foreground'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Sun className="h-5 w-5" />
              <span className="font-medium">라이트</span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            현재 테마: {settings?.theme === 'dark' ? '다크 모드' : '라이트 모드'}
          </p>
        </CardContent>
      </Card>

      {/* 알림 설정 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            알림 설정
          </CardTitle>
          <CardDescription>
            알림 수신 방식을 설정합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 이메일 알림 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">이메일 알림</p>
                <p className="text-sm text-muted-foreground">
                  중요 알림을 이메일로 받습니다
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={settings?.emailNotifications ?? false}
              onChange={handleEmailNotificationsChange}
              disabled={isUpdating}
              label="이메일 알림 토글"
            />
          </div>

          {/* 푸시 알림 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">푸시 알림</p>
                <p className="text-sm text-muted-foreground">
                  브라우저 푸시 알림을 받습니다
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={settings?.pushNotifications ?? false}
              onChange={handlePushNotificationsChange}
              disabled={isUpdating}
              label="푸시 알림 토글"
            />
          </div>
        </CardContent>
      </Card>

      {/* 업데이트 상태 표시 */}
      {isUpdating && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">저장 중...</span>
        </div>
      )}
    </div>
  );
}

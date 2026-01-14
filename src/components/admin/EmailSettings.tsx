'use client';

/**
 * 이메일 알림 설정 컴포넌트
 * 이메일 알림 활성화, 수신자 설정, 옵션 관리를 제공합니다.
 */

import { Mail, Check } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { useState, useEffect } from 'react';

export function EmailSettings() {
  const { emailConfig, updateEmailConfig } = useNotificationStore();
  const [email, setEmail] = useState(emailConfig.recipientEmail);
  const [saved, setSaved] = useState(false);

  // emailConfig 변경 시 로컬 상태 동기화
  useEffect(() => {
    setEmail(emailConfig.recipientEmail);
  }, [emailConfig.recipientEmail]);

  const handleSave = () => {
    updateEmailConfig({ recipientEmail: email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Mail className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">이메일 알림 설정</h3>
      </div>

      <div className="space-y-4">
        {/* 활성화 토글 */}
        <label className="flex items-center justify-between">
          <span>이메일 알림 활성화</span>
          <button
            onClick={() => updateEmailConfig({ enabled: !emailConfig.enabled })}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              emailConfig.enabled ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                emailConfig.enabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </label>

        {/* 수신 이메일 */}
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">
            수신 이메일
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2"
              disabled={!emailConfig.enabled}
            />
            <button
              onClick={handleSave}
              disabled={!emailConfig.enabled || !email}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
            >
              {saved ? <Check className="h-4 w-4" /> : '저장'}
            </button>
          </div>
        </div>

        {/* Critical만 발송 옵션 */}
        <label className="flex items-center justify-between">
          <span className="text-sm">Critical 알림만 이메일 발송</span>
          <input
            type="checkbox"
            checked={emailConfig.sendOnCriticalOnly}
            onChange={(e) =>
              updateEmailConfig({ sendOnCriticalOnly: e.target.checked })
            }
            disabled={!emailConfig.enabled}
            className="h-4 w-4"
          />
        </label>

        {/* 쿨다운 설정 */}
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">
            이메일 쿨다운 (분)
          </label>
          <input
            type="number"
            value={emailConfig.cooldownMinutes}
            onChange={(e) =>
              updateEmailConfig({
                cooldownMinutes: parseInt(e.target.value) || 30,
              })
            }
            min={5}
            max={120}
            className="w-24 rounded-md border border-border bg-background px-3 py-2"
            disabled={!emailConfig.enabled}
          />
        </div>

        {/* 안내 메시지 */}
        <p className="text-xs text-muted-foreground">
          * RESEND_API_KEY 환경 변수가 설정되어야 이메일이 발송됩니다.
        </p>
      </div>
    </div>
  );
}

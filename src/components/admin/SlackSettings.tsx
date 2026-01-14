'use client';

/**
 * Slack 알림 설정 컴포넌트
 * Slack Webhook 알림 활성화, URL 설정, 옵션 관리를 제공합니다.
 */

import { MessageSquare, Check, AlertCircle } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { useState, useEffect } from 'react';
import { SLACK_CONFIG } from '@/config/constants';

export function SlackSettings() {
  const { slackConfig, updateSlackConfig } = useNotificationStore();
  const [webhookUrl, setWebhookUrl] = useState(slackConfig.webhookUrl);
  const [saved, setSaved] = useState(false);
  const [urlError, setUrlError] = useState('');

  // slackConfig 변경 시 로컬 상태 동기화
  useEffect(() => {
    setWebhookUrl(slackConfig.webhookUrl);
  }, [slackConfig.webhookUrl]);

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // 빈 값은 허용
    return SLACK_CONFIG.WEBHOOK_URL_PATTERN.test(url);
  };

  const handleSave = () => {
    if (!validateUrl(webhookUrl)) {
      setUrlError('올바른 Slack Webhook URL 형식이 아닙니다');
      return;
    }
    setUrlError('');
    updateSlackConfig({ webhookUrl });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Slack 알림 설정</h3>
      </div>

      <div className="space-y-4">
        {/* 활성화 토글 */}
        <label className="flex items-center justify-between">
          <span>Slack 알림 활성화</span>
          <button
            onClick={() => updateSlackConfig({ enabled: !slackConfig.enabled })}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              slackConfig.enabled ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                slackConfig.enabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </label>

        {/* Webhook URL */}
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">
            Slack Webhook URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => {
                setWebhookUrl(e.target.value);
                setUrlError('');
              }}
              placeholder="https://hooks.slack.com/services/XXX/YYY/ZZZ"
              className={`flex-1 rounded-md border bg-background px-3 py-2 ${
                urlError ? 'border-destructive' : 'border-border'
              }`}
              disabled={!slackConfig.enabled}
            />
            <button
              onClick={handleSave}
              disabled={!slackConfig.enabled || !webhookUrl}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
            >
              {saved ? <Check className="h-4 w-4" /> : '저장'}
            </button>
          </div>
          {urlError && (
            <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              {urlError}
            </p>
          )}
        </div>

        {/* Critical만 발송 옵션 */}
        <label className="flex items-center justify-between">
          <span className="text-sm">Critical 알림만 Slack 발송</span>
          <input
            type="checkbox"
            checked={slackConfig.sendOnCriticalOnly}
            onChange={(e) =>
              updateSlackConfig({ sendOnCriticalOnly: e.target.checked })
            }
            disabled={!slackConfig.enabled}
            className="h-4 w-4"
          />
        </label>

        {/* 쿨다운 설정 */}
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">
            메시지 쿨다운 (분)
          </label>
          <input
            type="number"
            value={slackConfig.cooldownMinutes}
            onChange={(e) =>
              updateSlackConfig({
                cooldownMinutes: parseInt(e.target.value) || 30,
              })
            }
            min={5}
            max={120}
            className="w-24 rounded-md border border-border bg-background px-3 py-2"
            disabled={!slackConfig.enabled}
          />
        </div>

        {/* 설정 안내 */}
        <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          <p className="font-medium mb-1">Webhook URL 얻는 방법:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>api.slack.com/apps에서 앱 생성</li>
            <li>Incoming Webhooks 활성화</li>
            <li>Add New Webhook to Workspace 클릭</li>
            <li>채널 선택 후 URL 복사</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

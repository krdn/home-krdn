'use client';

/**
 * 알림 채널 설정 스토어
 * 이메일, Slack 등 알림 채널 설정을 관리합니다.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EmailNotificationConfig, SlackNotificationConfig } from '@/types/notification';
import { EMAIL_CONFIG, SLACK_CONFIG } from '@/config/constants';

interface NotificationState {
  emailConfig: EmailNotificationConfig;
  slackConfig: SlackNotificationConfig;
  updateEmailConfig: (config: Partial<EmailNotificationConfig>) => void;
  updateSlackConfig: (config: Partial<SlackNotificationConfig>) => void;
  resetEmailConfig: () => void;
  resetSlackConfig: () => void;
}

const defaultEmailConfig: EmailNotificationConfig = {
  enabled: false,
  recipientEmail: '',
  sendOnCriticalOnly: true,
  cooldownMinutes: EMAIL_CONFIG.DEFAULT_COOLDOWN_MINUTES,
};

const defaultSlackConfig: SlackNotificationConfig = {
  enabled: false,
  webhookUrl: '',
  sendOnCriticalOnly: true,
  cooldownMinutes: SLACK_CONFIG.DEFAULT_COOLDOWN_MINUTES,
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      emailConfig: defaultEmailConfig,
      slackConfig: defaultSlackConfig,

      updateEmailConfig: (config) =>
        set((state) => ({
          emailConfig: { ...state.emailConfig, ...config },
        })),

      updateSlackConfig: (config) =>
        set((state) => ({
          slackConfig: { ...state.slackConfig, ...config },
        })),

      resetEmailConfig: () => set({ emailConfig: defaultEmailConfig }),
      resetSlackConfig: () => set({ slackConfig: defaultSlackConfig }),
    }),
    {
      name: 'notification-store',
    }
  )
);

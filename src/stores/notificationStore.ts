'use client';

/**
 * 알림 채널 설정 스토어
 * 이메일, Slack 등 알림 채널 설정을 관리합니다.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EmailNotificationConfig } from '@/types/notification';
import { EMAIL_CONFIG } from '@/config/constants';

interface NotificationState {
  emailConfig: EmailNotificationConfig;
  updateEmailConfig: (config: Partial<EmailNotificationConfig>) => void;
  resetEmailConfig: () => void;
}

const defaultEmailConfig: EmailNotificationConfig = {
  enabled: false,
  recipientEmail: '',
  sendOnCriticalOnly: true,
  cooldownMinutes: EMAIL_CONFIG.DEFAULT_COOLDOWN_MINUTES,
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      emailConfig: defaultEmailConfig,

      updateEmailConfig: (config) =>
        set((state) => ({
          emailConfig: { ...state.emailConfig, ...config },
        })),

      resetEmailConfig: () => set({ emailConfig: defaultEmailConfig }),
    }),
    {
      name: 'notification-store',
    }
  )
);

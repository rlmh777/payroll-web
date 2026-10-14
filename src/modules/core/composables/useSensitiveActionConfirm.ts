import { Dialog, Notify } from 'quasar';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export type SensitiveAction = 'database_restore' | 'application_log_clear';

export interface SensitiveActionContext {
  source?: 'backup' | 'upload';
  backup_id?: string | null;
  file?: string | null;
}

export interface SensitiveActionConfirmation {
  challenge_key: string;
  confirmation_code: string;
}

interface ChallengeResponse {
  challenge_key?: string;
  sent_to?: string;
  expires_in?: number;
  message?: string;
}

function authHeaders(): HeadersInit {
  const authStore = useAuthStore();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (authStore.token) {
    headers.Authorization = `Bearer ${authStore.token}`;
  }
  return headers;
}

export async function requestSensitiveActionChallenge(
  action: SensitiveAction,
  context: SensitiveActionContext = {},
): Promise<ChallengeResponse> {
  const response = await fetch(`${API_URL}/sensitive-actions/challenge`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ action, context }),
  });
  const body = (await response.json().catch(() => ({}))) as ChallengeResponse;
  if (!response.ok || !body.challenge_key) {
    throw new Error(body.message || 'Unable to send a confirmation code.');
  }
  return body;
}

export function confirmSensitiveAction(options: {
  action: SensitiveAction;
  context?: SensitiveActionContext;
  title: string;
  message: string;
  confirmLabel?: string;
}): Promise<SensitiveActionConfirmation | null> {
  const confirmLabel = options.confirmLabel ?? 'Confirm';

  return new Promise((resolve) => {
    Dialog.create({
      title: options.title,
      message: `${options.message}\n\nA 6-digit confirmation code will be emailed to you. The action will not run until you enter that code.`,
      cancel: true,
      persistent: true,
      ok: { label: 'Email me a code', color: 'warning' },
    })
      .onOk(() => {
        void (async () => {
          try {
            const challenge = await requestSensitiveActionChallenge(
              options.action,
              options.context ?? {},
            );
            Notify.create({
              type: 'info',
              message: challenge.message || `Confirmation code sent to ${challenge.sent_to}.`,
              position: 'top',
            });
            Dialog.create({
              title: 'Enter confirmation code',
              message: `We emailed a code to ${challenge.sent_to}. It expires in 10 minutes.`,
              prompt: {
                model: '',
                type: 'text',
                label: '6-digit code',
              },
              cancel: true,
              persistent: true,
              ok: { label: confirmLabel, color: 'negative' },
            })
              .onOk((value: string) => {
                const confirmation_code = String(value ?? '').replace(/\s+/g, '');
                if (!/^\d{6}$/.test(confirmation_code)) {
                  Notify.create({
                    type: 'negative',
                    message: 'Enter the 6-digit code from the email.',
                    position: 'top',
                  });
                  resolve(null);
                  return;
                }
                resolve({
                  challenge_key: String(challenge.challenge_key),
                  confirmation_code,
                });
              })
              .onCancel(() => resolve(null));
          } catch (error) {
            Notify.create({
              type: 'negative',
              message:
                error instanceof Error
                  ? error.message
                  : 'Unable to send a confirmation code.',
              position: 'top',
            });
            resolve(null);
          }
        })();
      })
      .onCancel(() => resolve(null));
  });
}

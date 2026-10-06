import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

export type LoginBlockType = 'form' | 'heading' | 'message' | 'image';
export type LoginBackgroundMode = 'color' | 'image' | 'carousel';
export type LoginTextAlign = 'left' | 'center' | 'right';

export interface LoginPageImage {
  id: string;
  path: string;
  url?: string | null;
}

export interface LoginPageBlock {
  id: string;
  type: LoginBlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  text: string;
  fontSize: number;
  color: string;
  align: LoginTextAlign;
  imageId: string | null;
  maxWidth: number;
}

export interface LoginPageLayout {
  backgroundMode: LoginBackgroundMode;
  backgroundColor: string;
  carouselIntervalMs: number;
  images: LoginPageImage[];
  backgroundImageIds: string[];
  blocks: LoginPageBlock[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function newId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyLayout(): LoginPageLayout {
  return {
    backgroundMode: 'color',
    backgroundColor: '#0f172a',
    carouselIntervalMs: 7000,
    images: [],
    backgroundImageIds: [],
    blocks: [
      {
        id: 'heading-default',
        type: 'heading',
        x: 32,
        y: 8,
        width: 36,
        height: 10,
        zIndex: 2,
        text: 'Sign in',
        fontSize: 32,
        color: '#ffffff',
        align: 'center',
        imageId: null,
        maxWidth: 0,
      },
      {
        id: 'message-default',
        type: 'message',
        x: 32,
        y: 18,
        width: 36,
        height: 8,
        zIndex: 2,
        text: 'Use your username or email to continue.',
        fontSize: 14,
        color: '#cbd5e1',
        align: 'center',
        imageId: null,
        maxWidth: 0,
      },
      {
        id: 'form-default',
        type: 'form',
        x: 5,
        y: 28,
        width: 90,
        height: 62,
        zIndex: 3,
        text: '',
        fontSize: 16,
        color: '#0f172a',
        align: 'center',
        imageId: null,
        maxWidth: 400,
      },
    ],
  };
}

function normalizeBlock(block: Partial<LoginPageBlock>, fallbackType: LoginBlockType = 'heading'): LoginPageBlock {
  const type = (['form', 'heading', 'message', 'image'] as LoginBlockType[]).includes(block.type as LoginBlockType)
    ? (block.type as LoginBlockType)
    : fallbackType;
  const align = (['left', 'center', 'right'] as LoginTextAlign[]).includes(block.align as LoginTextAlign)
    ? (block.align as LoginTextAlign)
    : 'center';

  let x = clamp(Number(block.x ?? 10), 0, 95);
  let width = clamp(Number(block.width ?? 30), 8, 100);
  let maxWidth = 0;
  if (type === 'form') {
    const hasExplicitMax = block.maxWidth != null && Number.isFinite(Number(block.maxWidth));
    maxWidth = clamp(Number(block.maxWidth ?? 400), 240, 960);
    if (!hasExplicitMax && Math.abs(x - 32) < 0.01 && Math.abs(width - 36) < 0.01) {
      x = 5;
      width = 90;
    }
  }

  return {
    id: block.id || newId(type),
    type,
    x,
    y: clamp(Number(block.y ?? 10), 0, 95),
    width,
    height: clamp(Number(block.height ?? 12), 6, 100),
    zIndex: Math.max(1, Number(block.zIndex ?? 1)),
    text: String(block.text ?? ''),
    fontSize: clamp(Number(block.fontSize ?? 16), 10, 72),
    color: String(block.color ?? '#ffffff'),
    align,
    imageId: type === 'image' ? (block.imageId ?? null) : null,
    maxWidth,
  };
}

export function normalizeLayout(data: Partial<LoginPageLayout> | null | undefined): LoginPageLayout {
  const fallback = emptyLayout();
  const mode = data?.backgroundMode;
  const backgroundMode: LoginBackgroundMode = mode === 'image' || mode === 'carousel' ? mode : 'color';
  const images = (data?.images ?? []).filter((image): image is LoginPageImage => Boolean(image?.id && image?.path));
  const imageIds = new Set(images.map((image) => image.id));
  const backgroundImageIds = (data?.backgroundImageIds ?? []).filter((id) => imageIds.has(id));
  const blocks: LoginPageBlock[] = [];
  let hasForm = false;

  for (const block of data?.blocks ?? []) {
    const next = normalizeBlock(block);
    if (next.type === 'form') {
      if (hasForm) {
        continue;
      }
      hasForm = true;
    }
    blocks.push(next);
  }

  if (!hasForm) {
    const form = fallback.blocks.find((block) => block.type === 'form');
    if (form) {
      blocks.push(form);
    }
  }

  return {
    backgroundMode,
    backgroundColor: data?.backgroundColor || fallback.backgroundColor,
    carouselIntervalMs: clamp(Number(data?.carouselIntervalMs ?? fallback.carouselIntervalMs), 2000, 30000),
    images,
    backgroundImageIds,
    blocks,
  };
}

export function createBlock(type: LoginBlockType, x = 12, y = 12): LoginPageBlock {
  const defaults: Record<LoginBlockType, Partial<LoginPageBlock>> = {
    form: { width: 90, height: 62, zIndex: 5, color: '#0f172a', maxWidth: 400, align: 'center' },
    heading: { width: 36, height: 10, text: 'Welcome', fontSize: 32, color: '#ffffff' },
    message: {
      width: 36,
      height: 10,
      text: 'Add a short message for people signing in.',
      fontSize: 14,
      color: '#e2e8f0',
    },
    image: { width: 28, height: 28, color: '#ffffff' },
  };

  return normalizeBlock({
    ...defaults[type],
    type,
    x,
    y,
  }, type);
}

export const useLoginPageStore = defineStore('loginPage', {
  state: (): {
    layout: LoginPageLayout;
    isLoading: boolean;
    isSaving: boolean;
    isUploading: boolean;
    error: string | null;
  } => ({
    layout: emptyLayout(),
    isLoading: false,
    isSaving: false,
    isUploading: false,
    error: null,
  }),

  actions: {
    async fetchPublicLayout() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/login-page`);
        if (!response.ok) {
          throw new Error('Failed to load login page');
        }
        this.layout = normalizeLayout(await response.json());
        return this.layout;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load login page';
        this.layout = emptyLayout();
        return this.layout;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchSettings() {
      const authStore = useAuthStore();
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/login-page-settings`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${authStore.token}`,
          },
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to load login page settings');
        }
        this.layout = normalizeLayout(await response.json());
        return this.layout;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load login page settings';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async saveSettings() {
      const authStore = useAuthStore();
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/login-page-settings`, {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authStore.token}`,
          },
          body: JSON.stringify(this.layout),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to save login page');
        }
        this.layout = normalizeLayout(body);
        return this.layout;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to save login page';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async uploadImage(file: File) {
      const authStore = useAuthStore();
      this.isUploading = true;
      this.error = null;
      try {
        const body = new FormData();
        body.append('image', file);
        const response = await fetch(`${API_URL}/login-page-settings/images`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${authStore.token}`,
          },
          body,
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.message || 'Failed to upload image');
        }
        this.layout = normalizeLayout(payload.layout ?? payload);
        return payload.image as LoginPageImage;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to upload image';
        throw error;
      } finally {
        this.isUploading = false;
      }
    },

    async removeImage(imageId: string) {
      const authStore = useAuthStore();
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/login-page-settings/images/${imageId}`, {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${authStore.token}`,
          },
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to remove image');
        }
        this.layout = normalizeLayout(body);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to remove image';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLoginPageStore, import.meta.hot));
}

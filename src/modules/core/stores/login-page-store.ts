import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

export type LoginBlockType = 'form' | 'heading' | 'message' | 'image';
export type LoginBackgroundMode = 'color' | 'image' | 'carousel';
export type LoginTextAlign = 'left' | 'center' | 'right';
export type LoginHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export const LOGIN_GRID_MIN = 2;
export const LOGIN_GRID_MAX = 24;
export const DEFAULT_GRID_COLUMNS = 24;
export const DEFAULT_GRID_ROWS = 24;

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
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  zIndex: number;
  text: string;
  fontSize: number;
  color: string;
  align: LoginTextAlign;
  imageId: string | null;
  maxWidth: number;
  headingLevel: LoginHeadingLevel;
  cardBackground: string;
  cardBorderColor: string;
  cardBorderWidth: number;
  cardRadius: number;
  cardShadow: number;
}

export interface LoginPageLayout {
  backgroundMode: LoginBackgroundMode;
  backgroundColor: string;
  carouselIntervalMs: number;
  gridColumns: number;
  gridRows: number;
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

export function clampGridSize(value: number, fallback: number): number {
  const next = Number(value);
  if (!Number.isFinite(next)) {
    return fallback;
  }

  return Math.round(clamp(next, LOGIN_GRID_MIN, LOGIN_GRID_MAX));
}

export function headingFontSize(level: number): number {
  const sizes: Record<number, number> = { 1: 40, 2: 32, 3: 26, 4: 22, 5: 18, 6: 16 };
  return sizes[clamp(Math.round(level), 1, 6)] ?? 32;
}

export function normalizeHeadingLevel(value: unknown): LoginHeadingLevel {
  const level = Math.round(Number(value ?? 1));
  if (level >= 1 && level <= 6) {
    return level as LoginHeadingLevel;
  }

  return 1;
}

export function defaultFormChrome(): Pick<
  LoginPageBlock,
  'cardBackground' | 'cardBorderColor' | 'cardBorderWidth' | 'cardRadius' | 'cardShadow'
> {
  return {
    cardBackground: '#ffffff',
    cardBorderColor: '#e2e8f0',
    cardBorderWidth: 0,
    cardRadius: 12,
    cardShadow: 2,
  };
}

export function formCardShadow(level: number): string {
  const shadows = [
    'none',
    '0 4px 14px rgba(15, 23, 42, 0.10)',
    '0 12px 32px rgba(15, 23, 42, 0.18)',
    '0 22px 48px rgba(15, 23, 42, 0.28)',
  ];
  const fallback = '0 12px 32px rgba(15, 23, 42, 0.18)';

  return shadows[clamp(Math.round(level), 0, 3)] ?? fallback;
}

export function defaultBlockSpan(type: LoginBlockType): { colSpan: number; rowSpan: number } {
  if (type === 'form') {
    return { colSpan: 6, rowSpan: 5 };
  }
  if (type === 'image') {
    return { colSpan: 4, rowSpan: 4 };
  }
  if (type === 'heading') {
    return { colSpan: 6, rowSpan: 1 };
  }

  return { colSpan: 6, rowSpan: 1 };
}

export function placementFromGrid(
  col: number,
  row: number,
  colSpan: number,
  rowSpan: number,
  columns = DEFAULT_GRID_COLUMNS,
  rows = DEFAULT_GRID_ROWS,
): Pick<LoginPageBlock, 'col' | 'row' | 'colSpan' | 'rowSpan' | 'x' | 'y' | 'width' | 'height'> {
  const gridColumns = clampGridSize(columns, DEFAULT_GRID_COLUMNS);
  const gridRows = clampGridSize(rows, DEFAULT_GRID_ROWS);
  const nextColSpan = clamp(Math.round(colSpan), 1, gridColumns);
  const nextRowSpan = clamp(Math.round(rowSpan), 1, gridRows);
  const nextCol = clamp(Math.round(col), 0, gridColumns - nextColSpan);
  const nextRow = clamp(Math.round(row), 0, gridRows - nextRowSpan);
  const spanCols = clamp(nextColSpan, 1, gridColumns - nextCol);
  const spanRows = clamp(nextRowSpan, 1, gridRows - nextRow);

  return {
    col: nextCol,
    row: nextRow,
    colSpan: spanCols,
    rowSpan: spanRows,
    x: (nextCol / gridColumns) * 100,
    y: (nextRow / gridRows) * 100,
    width: (spanCols / gridColumns) * 100,
    height: (spanRows / gridRows) * 100,
  };
}

export function snapRectToGrid(
  x: number,
  y: number,
  width: number,
  height: number,
  columns = DEFAULT_GRID_COLUMNS,
  rows = DEFAULT_GRID_ROWS,
): ReturnType<typeof placementFromGrid> {
  const gridColumns = clampGridSize(columns, DEFAULT_GRID_COLUMNS);
  const gridRows = clampGridSize(rows, DEFAULT_GRID_ROWS);
  const colSpan = clamp(Math.round((Number(width) / 100) * gridColumns) || 1, 1, gridColumns);
  const rowSpan = clamp(Math.round((Number(height) / 100) * gridRows) || 1, 1, gridRows);
  const col = clamp(Math.round((Number(x) / 100) * gridColumns), 0, gridColumns - colSpan);
  const row = clamp(Math.round((Number(y) / 100) * gridRows), 0, gridRows - rowSpan);

  return placementFromGrid(col, row, colSpan, rowSpan, gridColumns, gridRows);
}

export function cellFromPoint(
  x: number,
  y: number,
  columns = DEFAULT_GRID_COLUMNS,
  rows = DEFAULT_GRID_ROWS,
): { col: number; row: number } {
  const gridColumns = clampGridSize(columns, DEFAULT_GRID_COLUMNS);
  const gridRows = clampGridSize(rows, DEFAULT_GRID_ROWS);

  return {
    col: clamp(Math.floor((Number(x) / 100) * gridColumns), 0, gridColumns - 1),
    row: clamp(Math.floor((Number(y) / 100) * gridRows), 0, gridRows - 1),
  };
}

export function emptyLayout(): LoginPageLayout {
  return {
    backgroundMode: 'color',
    backgroundColor: '#0f172a',
    carouselIntervalMs: 7000,
    gridColumns: DEFAULT_GRID_COLUMNS,
    gridRows: DEFAULT_GRID_ROWS,
    images: [],
    backgroundImageIds: [],
    blocks: [
      {
        id: 'heading-default',
        type: 'heading',
        ...placementFromGrid(6, 0, 12, 3),
        zIndex: 2,
        text: 'Sign in',
        fontSize: headingFontSize(1),
        color: '#ffffff',
        align: 'center',
        imageId: null,
        maxWidth: 0,
        headingLevel: 1,
        ...defaultFormChrome(),
      },
      {
        id: 'form-default',
        type: 'form',
        ...placementFromGrid(6, 6, 12, 15),
        zIndex: 3,
        text: '',
        fontSize: 16,
        color: '#0f172a',
        align: 'center',
        imageId: null,
        maxWidth: 400,
        headingLevel: 1,
        ...defaultFormChrome(),
      },
    ],
  };
}

function normalizeBlock(
  block: Partial<LoginPageBlock>,
  fallbackType: LoginBlockType = 'heading',
  columns = DEFAULT_GRID_COLUMNS,
  rows = DEFAULT_GRID_ROWS,
): LoginPageBlock {
  const type = (['form', 'heading', 'message', 'image'] as LoginBlockType[]).includes(block.type as LoginBlockType)
    ? (block.type as LoginBlockType)
    : fallbackType;
  const align = (['left', 'center', 'right'] as LoginTextAlign[]).includes(block.align as LoginTextAlign)
    ? (block.align as LoginTextAlign)
    : 'center';

  let x = clamp(Number(block.x ?? 10), 0, 99);
  let width = clamp(Number(block.width ?? 30), 1, 100);
  const y = clamp(Number(block.y ?? 10), 0, 99);
  const height = clamp(Number(block.height ?? 12), 1, 100);
  let maxWidth = 0;
  if (type === 'form') {
    const hasExplicitMax = block.maxWidth != null && Number.isFinite(Number(block.maxWidth));
    maxWidth = clamp(Number(block.maxWidth ?? 400), 240, 960);
    if (!hasExplicitMax && Math.abs(x - 32) < 0.01 && Math.abs(width - 36) < 0.01) {
      x = 5;
      width = 90;
    }
  }

  const hasGrid = [block.col, block.row, block.colSpan, block.rowSpan].some(
    (value) => value != null && Number.isFinite(Number(value)),
  );
  const placement = hasGrid
    ? placementFromGrid(
        Number(block.col ?? 0),
        Number(block.row ?? 0),
        Number(block.colSpan ?? defaultBlockSpan(type).colSpan),
        Number(block.rowSpan ?? defaultBlockSpan(type).rowSpan),
        columns,
        rows,
      )
    : snapRectToGrid(x, y, width, height, columns, rows);

  const chrome = defaultFormChrome();
  const headingLevel = type === 'heading' ? normalizeHeadingLevel(block.headingLevel) : 1;

  return {
    id: block.id || newId(type),
    type,
    ...placement,
    zIndex: Math.max(1, Number(block.zIndex ?? 1)),
    text: String(block.text ?? ''),
    fontSize: clamp(Number(block.fontSize ?? (type === 'heading' ? headingFontSize(headingLevel) : 16)), 10, 72),
    color: String(block.color ?? (type === 'form' ? '#0f172a' : '#ffffff')),
    align,
    imageId: type === 'image' ? (block.imageId ?? null) : null,
    maxWidth,
    headingLevel,
    cardBackground: String(block.cardBackground ?? chrome.cardBackground),
    cardBorderColor: String(block.cardBorderColor ?? chrome.cardBorderColor),
    cardBorderWidth: clamp(Number(block.cardBorderWidth ?? chrome.cardBorderWidth), 0, 12),
    cardRadius: clamp(Number(block.cardRadius ?? chrome.cardRadius), 0, 48),
    cardShadow: clamp(Number(block.cardShadow ?? chrome.cardShadow), 0, 3),
  };
}

export function normalizeLayout(data: Partial<LoginPageLayout> | null | undefined): LoginPageLayout {
  const fallback = emptyLayout();
  const mode = data?.backgroundMode;
  const backgroundMode: LoginBackgroundMode = mode === 'image' || mode === 'carousel' ? mode : 'color';
  const gridColumns = clampGridSize(Number(data?.gridColumns ?? fallback.gridColumns), fallback.gridColumns);
  const gridRows = clampGridSize(Number(data?.gridRows ?? fallback.gridRows), fallback.gridRows);
  const images = (data?.images ?? []).filter((image): image is LoginPageImage => Boolean(image?.id && image?.path));
  const imageIds = new Set(images.map((image) => image.id));
  const backgroundImageIds = (data?.backgroundImageIds ?? []).filter((id) => imageIds.has(id));
  const blocks: LoginPageBlock[] = [];
  let hasForm = false;

  for (const block of data?.blocks ?? []) {
    const next = normalizeBlock(block, 'heading', gridColumns, gridRows);
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
      blocks.push(normalizeBlock(form, 'form', gridColumns, gridRows));
    }
  }

  return {
    backgroundMode,
    backgroundColor: data?.backgroundColor || fallback.backgroundColor,
    carouselIntervalMs: clamp(Number(data?.carouselIntervalMs ?? fallback.carouselIntervalMs), 2000, 30000),
    gridColumns,
    gridRows,
    images,
    backgroundImageIds,
    blocks,
  };
}

export function createBlock(
  type: LoginBlockType,
  x = 12,
  y = 12,
  columns = DEFAULT_GRID_COLUMNS,
  rows = DEFAULT_GRID_ROWS,
  extras: Partial<LoginPageBlock> = {},
): LoginPageBlock {
  const cell = cellFromPoint(x, y, columns, rows);
  const span = defaultBlockSpan(type);
  const headingLevel = normalizeHeadingLevel(extras.headingLevel);
  const defaults: Record<LoginBlockType, Partial<LoginPageBlock>> = {
    form: { zIndex: 5, color: '#0f172a', maxWidth: 400, align: 'center', ...defaultFormChrome() },
    heading: {
      text: extras.text || 'Welcome',
      fontSize: headingFontSize(headingLevel),
      color: '#ffffff',
      headingLevel,
    },
    message: {
      text: 'Add a short message for people signing in.',
      fontSize: 14,
      color: '#e2e8f0',
    },
    image: { color: '#ffffff' },
  };

  return normalizeBlock({
    ...defaults[type],
    ...extras,
    type,
    col: cell.col,
    row: cell.row,
    colSpan: span.colSpan,
    rowSpan: span.rowSpan,
  }, type, columns, rows);
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
        const incoming = normalizeLayout(payload.layout ?? payload);
        this.layout = {
          ...this.layout,
          images: incoming.images,
        };
        return (payload.image ?? incoming.images.at(-1)) as LoginPageImage;
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
        const incoming = normalizeLayout(body);
        this.layout = {
          ...this.layout,
          images: incoming.images,
          backgroundImageIds: this.layout.backgroundImageIds.filter((id) => id !== imageId),
          blocks: this.layout.blocks.map((block) => (
            block.imageId === imageId ? { ...block, imageId: null } : block
          )),
        };
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

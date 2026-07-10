import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export const DEFAULT_DOCUMENT_TAG_COLOR = '#1976D2';

export interface DocumentTag {
  id: string;
  parentId?: string | null;
  name: string;
  description?: string | null;
  color?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  parent?: DocumentTag | null;
}

export interface DocumentTagPayload {
  parentId?: string | null;
  name: string;
  description?: string | null;
  color?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export function buildDocumentTagPath(tags: DocumentTag[], tagId: string | null | undefined): string {
  if (!tagId) {
    return '';
  }

  const byId = new Map(tags.map((tag) => [tag.id, tag]));
  const parts: string[] = [];
  let current = byId.get(tagId);

  while (current) {
    parts.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return parts.join(' / ');
}

export function resolveDocumentTag(
  tags: DocumentTag[],
  tagId: string | null | undefined,
): DocumentTag | null {
  if (!tagId) {
    return null;
  }

  return tags.find((tag) => tag.id === tagId) ?? null;
}

export function resolveDocumentTagColor(colorOrTag?: string | null | Pick<DocumentTag, 'color'>): string {
  const color = typeof colorOrTag === 'string' || colorOrTag == null
    ? colorOrTag
    : colorOrTag.color;
  const normalized = color?.trim();
  return normalized && /^#[0-9A-Fa-f]{6}$/.test(normalized) ? normalized : DEFAULT_DOCUMENT_TAG_COLOR;
}

export const useDocumentTagStore = defineStore('documentTag', {
  state: () => ({
    tags: [] as DocumentTag[],
    tagOptions: [] as DocumentTag[],
    isLoading: false,
    isLoadingOptions: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    search: '',
    error: null as string | null,
    tagToEdit: null as DocumentTag | null,
    isCreateOpen: false,
  }),

  actions: {
    buildHeaders() {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchTags(page = 1, perPage = 25) {
      this.isLoading = true;
      this.error = null;

      try {
        const params = new URLSearchParams({
          page: String(page),
          per_page: String(perPage),
        });
        if (this.search) params.append('search', this.search);

        const response = await fetch(`${API_URL}/document-tags?${params}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || body.error || 'Failed to load document tags');
        }

        const data = await response.json();
        this.tags = data.data ?? [];
        this.currentPage = data.current_page ?? page;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? this.tags.length;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading document tags';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchTagOptions() {
      this.isLoadingOptions = true;
      try {
        const params = new URLSearchParams({ all: '1', active_only: '1' });
        const response = await fetch(`${API_URL}/document-tags?${params}`, {
          headers: this.buildHeaders(),
        });
        if (!response.ok) throw new Error('Failed to load document tag options');
        const data = await response.json();
        this.tagOptions = data.data ?? [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading tag options';
      } finally {
        this.isLoadingOptions = false;
      }
    },

    async createTag(payload: DocumentTagPayload): Promise<DocumentTag> {
      const response = await fetch(`${API_URL}/document-tags`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || body.message || 'Create failed');
      }
      const body = await response.json();
      await this.fetchTags(this.currentPage);
      await this.fetchTagOptions();
      return body.data as DocumentTag;
    },

    async updateTag(id: string, payload: Partial<DocumentTagPayload>): Promise<DocumentTag> {
      const response = await fetch(`${API_URL}/document-tags/${id}`, {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || body.message || 'Update failed');
      }
      const body = await response.json();
      await this.fetchTags(this.currentPage);
      await this.fetchTagOptions();
      return body.data as DocumentTag;
    },

    async deleteTag(id: string) {
      const response = await fetch(`${API_URL}/document-tags/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || body.message || 'Delete failed');
      }
      this.tags = this.tags.filter((tag) => tag.id !== id);
      this.total = Math.max(0, this.total - 1);
      await this.fetchTagOptions();
    },

    setTagToEdit(tag: DocumentTag | null) {
      this.tagToEdit = tag ? { ...tag } : null;
    },

    openCreateDialog() {
      this.isCreateOpen = true;
    },

    closeCreateDialog() {
      this.isCreateOpen = false;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDocumentTagStore, import.meta.hot));
}

import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface EmployeeGroupMember {
  id: string;
  employeeGroupId: string;
  employeeId: string;
  employeeCode?: string | null;
  employeeName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface EmployeeGroup {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  isActive: boolean;
  activeMemberCount?: number;
  members?: EmployeeGroupMember[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export const useEmployeeGroupStore = defineStore('employeeGroup', {
  state: () => ({
    groups: [] as EmployeeGroup[],
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    activeGroups(state): EmployeeGroup[] {
      return state.groups.filter((group) => group.isActive);
    },

    groupOptions(state): Array<{ label: string; value: string }> {
      return state.groups
        .filter((group) => group.isActive)
        .map((group) => ({ label: group.name, value: group.id }))
        .sort((left, right) => left.label.localeCompare(right.label));
    },

    employeeIdsByGroupId(state): Map<string, Set<string>> {
      const map = new Map<string, Set<string>>();

      for (const group of state.groups) {
        const memberIds = new Set(
          (group.members ?? []).map((member) => member.employeeId).filter(Boolean),
        );
        map.set(group.id, memberIds);
      }

      return map;
    },
  },

  actions: {
    buildHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`;
      }
      return headers;
    },

    async fetchGroups(options: { withMembers?: boolean; activeOnly?: boolean } = {}) {
      this.isLoading = true;
      this.error = null;

      const params = new URLSearchParams();
      if (options.withMembers) {
        params.append('with_members', '1');
      }
      if (options.activeOnly !== false) {
        params.append('active_only', '1');
      }

      try {
        const response = await fetch(`${API_URL}/employee-groups?${params}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response));
        }

        const data = await response.json();
        const rows = Array.isArray(data) ? data : (data.data ?? []);
        this.groups = rows.map((group: EmployeeGroup & { activeMembers?: EmployeeGroupMember[] }) => ({
          ...group,
          members: group.members ?? group.activeMembers ?? [],
        }));
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load employee groups.';
        this.groups = [];
      } finally {
        this.isLoading = false;
      }
    },

    async fetchGroup(id: string) {
      const response = await fetch(`${API_URL}/employee-groups/${id}`, {
        headers: this.buildHeaders(),
      });

      if (!response.ok) {
        throw new Error(await this.parseError(response));
      }

      return await response.json() as EmployeeGroup;
    },

    async createGroup(payload: Partial<EmployeeGroup>) {
      const response = await fetch(`${API_URL}/employee-groups`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await this.parseError(response));
      }

      const created = await response.json() as EmployeeGroup;
      this.groups = [...this.groups, created].sort((left, right) => left.name.localeCompare(right.name));
      return created;
    },

    async updateGroup(id: string, payload: Partial<EmployeeGroup>) {
      const response = await fetch(`${API_URL}/employee-groups/${id}`, {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await this.parseError(response));
      }

      const updated = await response.json() as EmployeeGroup;
      this.groups = this.groups.map((group) => (group.id === id ? { ...group, ...updated } : group));
      return updated;
    },

    async deleteGroup(id: string) {
      const response = await fetch(`${API_URL}/employee-groups/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });

      if (!response.ok && response.status !== 204) {
        throw new Error(await this.parseError(response));
      }

      this.groups = this.groups.filter((group) => group.id !== id);
    },

    async syncMembers(groupId: string, employeeIds: string[]) {
      const response = await fetch(`${API_URL}/employee-groups/${groupId}/members`, {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify({ employeeIds }),
      });

      if (!response.ok) {
        throw new Error(await this.parseError(response));
      }

      const updated = await response.json() as EmployeeGroup;
      this.groups = this.groups.map((group) => (group.id === groupId ? updated : group));
      return updated;
    },

    async parseError(response: Response) {
      const body = await response.json().catch(() => ({}));
      return body.message || `Request failed (${response.status})`;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeGroupStore, import.meta.hot));
}

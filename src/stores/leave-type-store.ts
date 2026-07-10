import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';
import type { LeaveTypeFormModel, LeaveTypeRecord } from 'src/components/settings/leave/leave-type-form';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export type LeaveType = LeaveTypeRecord;

export const useLeaveTypeStore = defineStore('leaveType', {
  state: () => ({
    leaveTypes: [] as LeaveType[],
    isLoading: false,
    isLoadingLeaveTypes: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    error: null as string | null,
  }),

  actions: {
    buildHeaders() {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchLeaveTypes(search?: string, page = 1, perPage = 50) {
      if (this.isLoadingLeaveTypes) return;

      this.isLoadingLeaveTypes = true;
      this.error = null;

      try {
        const queryParams = new URLSearchParams({
          per_page: String(perPage),
          page: String(page),
          sortBy: 'sortOrder',
          sortDirection: 'asc',
        });
        if (search) queryParams.append('search', search);

        const response = await fetch(`${API_URL}/leave-types?${queryParams}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) throw new Error(`Failed to fetch leave types: ${response.statusText}`);

        const data = await response.json();
        this.leaveTypes = data.data || data;
        this.currentPage = data.current_page ?? page;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? this.leaveTypes.length;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error fetching leave types';
      } finally {
        this.isLoadingLeaveTypes = false;
      }
    },

    async createLeaveType(payload: LeaveTypeFormModel | string): Promise<LeaveType | null> {
      this.isLoading = true;
      this.error = null;

      try {
        const body = typeof payload === 'string' ? { name: payload, code: payload.toUpperCase().replace(/\s+/g, '_') } : payload;
        const response = await fetch(`${API_URL}/leave-types`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(this.extractError(errorData) || 'Failed to create leave type');
        }

        const newLeaveType = await response.json();
        this.leaveTypes = [...this.leaveTypes, newLeaveType];
        return newLeaveType;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error creating leave type';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateLeaveType(id: number | string, payload: LeaveTypeFormModel | string): Promise<LeaveType | null> {
      this.isLoading = true;
      this.error = null;

      try {
        const body = typeof payload === 'string' ? { name: payload } : payload;
        const response = await fetch(`${API_URL}/leave-types/${id}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(this.extractError(errorData) || 'Failed to update leave type');
        }

        const updatedLeaveType = await response.json();
        const index = this.leaveTypes.findIndex((lt) => String(lt.id) === String(id));
        if (index !== -1) this.leaveTypes[index] = updatedLeaveType;
        return updatedLeaveType;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error updating leave type';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteLeaveType(id: number | string): Promise<boolean> {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/leave-types/${id}`, {
          method: 'DELETE',
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(this.extractError(errorData) || 'Failed to delete leave type');
        }

        this.leaveTypes = this.leaveTypes.filter((lt) => String(lt.id) !== String(id));
        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error deleting leave type';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    extractError(body: Record<string, unknown>): string | null {
      const errors = body.errors;
      if (errors && typeof errors === 'object') {
        const first = Object.values(errors)[0];
        if (Array.isArray(first) && first[0]) return String(first[0]);
      }
      return typeof body.message === 'string' ? body.message : null;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLeaveTypeStore, import.meta.hot));
}

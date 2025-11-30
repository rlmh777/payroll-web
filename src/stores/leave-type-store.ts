import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';
import type { LeaveType } from '../components/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

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

  getters: {},

  actions: {
    async fetchLeaveTypes(search?: string) {
      if (this.isLoadingLeaveTypes) return;

      this.isLoadingLeaveTypes = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const queryParams = new URLSearchParams();
        if (search) {
          queryParams.append('search', search);
        }

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/leave-types?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch leave types: ${response.statusText}`);
        }

        const data = await response.json();
        this.leaveTypes = data.data || data;
      } catch (error) {
        console.error('Error fetching leave types:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching leave types';
      } finally {
        this.isLoadingLeaveTypes = false;
      }
    },

    async createLeaveType(name: string): Promise<LeaveType | null> {
      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/leave-types`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to create leave type: ${response.statusText}`);
        }

        const result = await response.json();
        const newLeaveType = result.data || result;

        // Add to leave types list
        this.leaveTypes = [...this.leaveTypes, newLeaveType];

        return newLeaveType;
      } catch (error) {
        console.error('Error creating leave type:', error);
        this.error = error instanceof Error ? error.message : 'Error creating leave type';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateLeaveType(id: string, name: string): Promise<LeaveType | null> {
      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/leave-types/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to update leave type: ${response.statusText}`);
        }

        const result = await response.json();
        const updatedLeaveType = result.data || result;

        // Update in leave types list
        const index = this.leaveTypes.findIndex((lt) => lt.id === id);
        if (index !== -1) {
          this.leaveTypes[index] = updatedLeaveType;
        }

        return updatedLeaveType;
      } catch (error) {
        console.error('Error updating leave type:', error);
        this.error = error instanceof Error ? error.message : 'Error updating leave type';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteLeaveType(id: string): Promise<boolean> {
      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/leave-types/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete leave type: ${response.statusText}`);
        }

        // Remove from leave types list
        this.leaveTypes = this.leaveTypes.filter((lt) => lt.id !== id);

        return true;
      } catch (error) {
        console.error('Error deleting leave type:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting leave type';
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLeaveTypeStore, import.meta.hot));
}


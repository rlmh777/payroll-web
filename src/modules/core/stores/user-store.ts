import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface User {
  id: string;
  name: string;
  email: string;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  employee?: {
    id: string;
    code: string;
    firstName: string;
    lastName: string;
  } | null;
  rolesManyToMany?: Array<{
    id: string;
    name: string;
  }>;
}

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [] as User[],
    selectedUser: null as User | null,
    isLoading: false,
    error: null as string | null,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    hasMore: true,
    searchName: null as string | null,
    sortBy: 'name' as string,
    sortDirection: 'asc' as 'asc' | 'desc',
    perPage: 15,
  }),

  getters: {},

  actions: {
    async fetchUsers(reset: boolean = true) {
      if (this.isLoading) return;

      this.isLoading = true;
      this.error = null;

      if (reset) {
        this.currentPage = 1;
        this.users = [];
        this.hasMore = true;
      }

      const authStore = useAuthStore();
      const queryParams = new URLSearchParams();
      
      if (this.searchName) queryParams.append('search', this.searchName);
      if (this.sortBy) queryParams.append('sortBy', this.sortBy);
      if (this.sortDirection) queryParams.append('sortDirection', this.sortDirection);
      if (this.perPage) queryParams.append('per_page', this.perPage.toString());
      queryParams.append('page', this.currentPage.toString());

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`;
      }

      try {
        const response = await fetch(`${API_URL}/users?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.statusText}`);
        }

        const data = await response.json();

        if (reset) {
          this.users = data.data || [];
        } else {
          this.users = [...this.users, ...(data.data || [])];
        }

        this.currentPage = data.current_page || 1;
        this.lastPage = data.last_page || 1;
        this.total = data.total || 0;
        this.hasMore = (data.current_page || 1) < (data.last_page || 1);
      } catch (error) {
        console.error('Error fetching users:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching users';
      } finally {
        this.isLoading = false;
      }
    },

    async loadMoreUsers() {
      if (!this.hasMore || this.isLoading) {
        return;
      }

      this.currentPage += 1;
      await this.fetchUsers(false);
    },

    async fetchUserById(userId: string): Promise<User | null> {
      const authStore = useAuthStore();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`;
      }

      try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || data;
      } catch (error) {
        console.error('Error fetching user:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching user';
        return null;
      }
    },

    async updateUserPassword(userId: string, password: string): Promise<boolean> {
      const authStore = useAuthStore();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`;
      }

      try {
        const response = await fetch(`${API_URL}/users/${userId}/password`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ password }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update password: ${response.statusText}`);
        }

        return true;
      } catch (error) {
        console.error('Error updating password:', error);
        this.error = error instanceof Error ? error.message : 'Error updating password';
        return false;
      }
    },

    async sendPasswordResetEmail(userId: string): Promise<boolean> {
      const authStore = useAuthStore();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`;
      }

      try {
        const response = await fetch(`${API_URL}/users/${userId}/send-password-reset`, {
          method: 'POST',
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to send password reset email: ${response.statusText}`);
        }

        return true;
      } catch (error) {
        console.error('Error sending password reset email:', error);
        this.error = error instanceof Error ? error.message : 'Error sending password reset email';
        return false;
      }
    },

    async resetPassword(email: string, token: string, password: string): Promise<boolean> {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      try {
        const response = await fetch(`${API_URL}/users/reset-password`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            email,
            token,
            password,
            password_confirmation: password,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || `Failed to reset password: ${response.statusText}`);
        }

        return true;
      } catch (error) {
        console.error('Error resetting password:', error);
        this.error = error instanceof Error ? error.message : 'Error resetting password';
        return false;
      }
    },

    async linkUserToEmployee(userId: string, employeeId: string | null): Promise<boolean> {
      const authStore = useAuthStore();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`;
      }

      try {
        const response = await fetch(`${API_URL}/users/${userId}/employee`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ employee_id: employeeId || null }),
        });

        if (!response.ok) {
          throw new Error(`Failed to link user to employee: ${response.statusText}`);
        }

        // Refresh the user data
        await this.fetchUserById(userId);
        return true;
      } catch (error) {
        console.error('Error linking user to employee:', error);
        this.error = error instanceof Error ? error.message : 'Error linking user to employee';
        return false;
      }
    },

    setSelectedUser(user: User | null) {
      this.selectedUser = user;
    },
  },
});


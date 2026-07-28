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

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  roles?: string[];
}

const authHeaders = (): HeadersInit => {
  const authStore = useAuthStore();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authStore.token) {
    headers['Authorization'] = `Bearer ${authStore.token}`;
  }

  return headers;
};

const parseApiError = async (response: Response, fallback: string): Promise<string> => {
  try {
    const data = await response.json();
    if (data?.message && typeof data.message === 'string') {
      return data.message;
    }
    if (data?.errors && typeof data.errors === 'object') {
      const first = Object.values(data.errors as Record<string, string[] | string>)[0];
      if (Array.isArray(first) && first[0]) return first[0];
      if (typeof first === 'string') return first;
    }
    if (data?.error && typeof data.error === 'string') {
      return data.error;
    }
  } catch {
    // ignore parse errors
  }
  return fallback;
};

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
    roleId: null as string | null,
    sortBy: 'name' as string,
    sortDirection: 'asc' as 'asc' | 'desc',
    perPage: 15,
  }),

  getters: {},

  actions: {
    upsertUser(user: User) {
      const index = this.users.findIndex((item) => item.id === user.id);
      if (index >= 0) {
        this.users[index] = { ...this.users[index], ...user };
      } else {
        this.users = [user, ...this.users];
        this.total += 1;
      }

      if (this.selectedUser?.id === user.id) {
        this.selectedUser = { ...this.selectedUser, ...user };
      }
    },

    async fetchUsers(reset: boolean = true) {
      if (this.isLoading) return;

      this.isLoading = true;
      this.error = null;

      if (reset) {
        this.currentPage = 1;
        this.users = [];
        this.hasMore = true;
      }

      const queryParams = new URLSearchParams();

      if (this.searchName) queryParams.append('search', this.searchName);
      if (this.roleId) queryParams.append('role_id', this.roleId);
      if (this.sortBy) queryParams.append('sortBy', this.sortBy);
      if (this.sortDirection) queryParams.append('sortDirection', this.sortDirection);
      if (this.perPage) queryParams.append('per_page', this.perPage.toString());
      queryParams.append('page', this.currentPage.toString());

      try {
        const response = await fetch(`${API_URL}/users?${queryParams.toString()}`, {
          headers: authHeaders(),
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
      try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
          headers: authHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user: ${response.statusText}`);
        }

        const data = await response.json();
        const user = (data.data || data) as User;
        this.upsertUser(user);
        return user;
      } catch (error) {
        console.error('Error fetching user:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching user';
        return null;
      }
    },

    async createUser(payload: CreateUserPayload): Promise<User | null> {
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          this.error = await parseApiError(response, `Failed to create user: ${response.statusText}`);
          return null;
        }

        const data = await response.json();
        const user = (data.data || data) as User;
        this.upsertUser(user);
        this.setSelectedUser(user);
        return user;
      } catch (error) {
        console.error('Error creating user:', error);
        this.error = error instanceof Error ? error.message : 'Error creating user';
        return null;
      }
    },

    async assignRoles(userId: string, roleIds: string[]): Promise<User | null> {
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/users/${userId}/roles`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ roles: roleIds }),
        });

        if (!response.ok) {
          this.error = await parseApiError(response, `Failed to assign roles: ${response.statusText}`);
          return null;
        }

        const data = await response.json();
        const user = (data.data || data) as User;
        this.upsertUser(user);
        return user;
      } catch (error) {
        console.error('Error assigning roles:', error);
        this.error = error instanceof Error ? error.message : 'Error assigning roles';
        return null;
      }
    },

    async removeRoles(userId: string, roleIds: string[]): Promise<User | null> {
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/users/${userId}/roles`, {
          method: 'DELETE',
          headers: authHeaders(),
          body: JSON.stringify({ roles: roleIds }),
        });

        if (!response.ok) {
          this.error = await parseApiError(response, `Failed to remove roles: ${response.statusText}`);
          return null;
        }

        const data = await response.json();
        const user = (data.user || data.data || data) as User;
        this.upsertUser(user);
        return user;
      } catch (error) {
        console.error('Error removing roles:', error);
        this.error = error instanceof Error ? error.message : 'Error removing roles';
        return null;
      }
    },

    async updateUserPassword(userId: string, password: string): Promise<boolean> {
      try {
        const response = await fetch(`${API_URL}/users/${userId}/password`, {
          method: 'PUT',
          headers: authHeaders(),
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
      try {
        const response = await fetch(`${API_URL}/users/${userId}/send-password-reset`, {
          method: 'POST',
          headers: authHeaders(),
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
      try {
        const response = await fetch(`${API_URL}/users/${userId}/employee`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ employee_id: employeeId || null }),
        });

        if (!response.ok) {
          throw new Error(`Failed to link user to employee: ${response.statusText}`);
        }

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

    setSearchName(value: string | null) {
      this.searchName = value?.trim() ? value.trim() : null;
    },

    setRoleId(value: string | null) {
      this.roleId = value || null;
    },
  },
});


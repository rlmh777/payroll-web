import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface Role {
  id: string;
  name: string;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  guard_name?: string;
}

interface ApiErrorData {
  error?: string;
  errors?: Record<string, string[] | string>;
  [key: string]: unknown;
}

interface CreateRoleBody {
  name: string;
  permissions?: string[];
}

interface UpdateRoleBody {
  name?: string;
  permissions?: string[];
}

export const useRoleStore = defineStore('role', {
  state: () => ({
    roles: [] as Role[],
    permissions: [] as Permission[],
    selectedRole: null as Role | null,
    isLoading: false,
    isLoadingRoles: false,
    isLoadingPermissions: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    error: null as string | null,
    searchFilters: {
      search: null as string | null,
    },
    permissionSearch: null as string | null,
  }),

  getters: {
    availablePermissions: (state): Permission[] => {
      if (!state.selectedRole || !state.selectedRole.permissions) {
        return state.permissions;
      }
      const rolePermissionIds = state.selectedRole.permissions.map(p => p.id);
      return state.permissions.filter(p => !rolePermissionIds.includes(p.id));
    },
  },

  actions: {
    async fetchRoles(page?: number, perPage?: number) {
      if (this.isLoadingRoles) return;

      this.isLoadingRoles = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const queryParams = new URLSearchParams();

        if (this.searchFilters.search) {
          queryParams.append('search', this.searchFilters.search);
        }

        const currentPage = page ?? this.currentPage;
        const itemsPerPage = perPage ?? 15;
        queryParams.append('page', currentPage.toString());
        queryParams.append('per_page', itemsPerPage.toString());

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/roles?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch roles: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.data && Array.isArray(data.data)) {
          this.roles = data.data;
          this.currentPage = data.current_page || 1;
          this.lastPage = data.last_page || 1;
          this.total = data.total || 0;
        } else if (Array.isArray(data)) {
          this.roles = data;
        } else {
          this.roles = [];
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching roles';
      } finally {
        this.isLoadingRoles = false;
      }
    },

    async fetchPermissions(search?: string) {
      if (this.isLoadingPermissions) return;

      this.isLoadingPermissions = true;
      this.error = null;
      this.permissionSearch = search || null;

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

        const url = search
          ? `${API_URL}/permissions?${queryParams.toString()}`
          : `${API_URL}/permissions`;

        const response = await fetch(url, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch permissions: ${response.statusText}`);
        }

        const data = await response.json();
        this.permissions = data.data || data || [];
      } catch (error) {
        console.error('Error fetching permissions:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching permissions';
      } finally {
        this.isLoadingPermissions = false;
      }
    },

    async fetchRole(id: string) {
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

        const response = await fetch(`${API_URL}/roles/${id}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch role: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching role:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching role';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async createRole(name: string, permissions?: string[]): Promise<Role | null> {
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

        const body: CreateRoleBody = { name };
        if (permissions && permissions.length > 0) {
          body.permissions = permissions;
        }

        const response = await fetch(`${API_URL}/roles`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          let errorMessage = errorData.error || `Failed to create role: ${response.statusText}`;
          if (errorData.errors) {
            const errorKeys = Object.keys(errorData.errors);
            if (errorKeys.length > 0 && errorKeys[0]) {
              const firstErrorKey = errorKeys[0];
              const firstError = errorData.errors[firstErrorKey];
              if (Array.isArray(firstError) && firstError[0]) {
                errorMessage = firstError[0];
              } else if (typeof firstError === 'string') {
                errorMessage = firstError;
              }
            }
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        const newRole = result.data || result;

        this.roles = [...this.roles, newRole];
        return newRole;
      } catch (error) {
        console.error('Error creating role:', error);
        this.error = error instanceof Error ? error.message : 'Error creating role';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateRole(id: string, name?: string, permissions?: string[]): Promise<Role | null> {
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

        const body: UpdateRoleBody = {};
        if (name !== undefined) {
          body.name = name;
        }
        if (permissions !== undefined) {
          body.permissions = permissions;
        }

        const response = await fetch(`${API_URL}/roles/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          let errorMessage = errorData.error || `Failed to update role: ${response.statusText}`;
          if (errorData.errors) {
            const errorKeys = Object.keys(errorData.errors);
            if (errorKeys.length > 0 && errorKeys[0]) {
              const firstErrorKey = errorKeys[0];
              const firstError = errorData.errors[firstErrorKey];
              if (Array.isArray(firstError) && firstError[0]) {
                errorMessage = firstError[0];
              } else if (typeof firstError === 'string') {
                errorMessage = firstError;
              }
            }
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        const updatedRole = result.data || result;

        const index = this.roles.findIndex((r) => r.id === id);
        if (index !== -1) {
          this.roles[index] = updatedRole;
        }

        if (this.selectedRole?.id === id) {
          this.selectedRole = updatedRole;
        }

        return updatedRole;
      } catch (error) {
        console.error('Error updating role:', error);
        this.error = error instanceof Error ? error.message : 'Error updating role';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteRole(id: string): Promise<boolean> {
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

        const response = await fetch(`${API_URL}/roles/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete role: ${response.statusText}`);
        }

        this.roles = this.roles.filter((r) => r.id !== id);
        if (this.selectedRole?.id === id) {
          this.selectedRole = null;
        }

        return true;
      } catch (error) {
        console.error('Error deleting role:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting role';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async addPermissionsToRole(roleId: string, permissionIds: string[]): Promise<boolean> {
      this.isLoading = true;
      this.error = null;

      try {
        // First, get the current role with its permissions
        const currentRole = await this.fetchRole(roleId);
        if (!currentRole) {
          throw new Error('Failed to fetch current role');
        }

        // Get current permission IDs
        const currentPermissionIds = currentRole.permissions
          ? currentRole.permissions.map((p: Permission) => p.id)
          : [];

        // Merge current permissions with new ones (avoid duplicates)
        const allPermissionIds = [...new Set([...currentPermissionIds, ...permissionIds])];

        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/roles/${roleId}/permissions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ permissions: allPermissionIds }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to add permissions: ${response.statusText}`);
        }

        const result = await response.json();
        const updatedRole = result.data || result;
        
        if (this.selectedRole?.id === roleId) {
          this.selectedRole = updatedRole;
        }

        const index = this.roles.findIndex((r) => r.id === roleId);
        if (index !== -1) {
          this.roles[index] = updatedRole;
        }

        return true;
      } catch (error) {
        console.error('Error adding permissions to role:', error);
        this.error = error instanceof Error ? error.message : 'Error adding permissions to role';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async addPermissionToRole(roleId: string, permissionId: string): Promise<boolean> {
      return this.addPermissionsToRole(roleId, [permissionId]);
    },

    async removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean> {
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

        const response = await fetch(`${API_URL}/roles/${roleId}/permissions`, {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ permissions: [permissionId] }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to remove permission: ${response.statusText}`);
        }

        const result = await response.json();
        const updatedRole = result.data || result;
        
        if (this.selectedRole?.id === roleId) {
          this.selectedRole = updatedRole;
        }

        const index = this.roles.findIndex((r) => r.id === roleId);
        if (index !== -1) {
          this.roles[index] = updatedRole;
        }

        return true;
      } catch (error) {
        console.error('Error removing permission from role:', error);
        this.error = error instanceof Error ? error.message : 'Error removing permission from role';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    setSelectedRole(role: Role | null) {
      this.selectedRole = role;
    },

    async createPermission(name: string, guardName?: string): Promise<Permission | null> {
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

        const body: { name: string; guard_name?: string } = { name };
        if (guardName) {
          body.guard_name = guardName;
        }

        const response = await fetch(`${API_URL}/permissions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          let errorMessage = errorData.error || `Failed to create permission: ${response.statusText}`;
          if (errorData.errors) {
            const errorKeys = Object.keys(errorData.errors);
            if (errorKeys.length > 0 && errorKeys[0]) {
              const firstErrorKey = errorKeys[0];
              const firstError = errorData.errors[firstErrorKey];
              if (Array.isArray(firstError) && firstError[0]) {
                errorMessage = firstError[0];
              } else if (typeof firstError === 'string') {
                errorMessage = firstError;
              }
            }
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        const newPermission = result.data || result;

        // Add to permissions list
        this.permissions = [...this.permissions, newPermission];

        return newPermission;
      } catch (error) {
        console.error('Error creating permission:', error);
        this.error = error instanceof Error ? error.message : 'Error creating permission';
        return null;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRoleStore, import.meta.hot));
}


import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface PayrateFrequencyRef {
  id: number;
  name?: string;
}

export interface PayPeriodSchedule {
  id: string;
  start_date: string;
  end_date: string;
  pay_date: string;
  pay_period_group_id?: string | null;
  payrate_frequency_id?: number | null;
  payrate_frequency?: PayrateFrequencyRef | null;
  created_at?: string;
  updated_at?: string;
}

interface ApiErrorData {
  error?: string;
  errors?: Record<string, string[] | string>;
  [key: string]: unknown;
}

interface CreatePayPeriodScheduleBody {
  id: string;
  start_date: string;
  end_date: string;
  pay_date: string;
  pay_period_group_id?: string | null;
  payrate_frequency_id?: number | null;
}

interface UpdatePayPeriodScheduleBody {
  start_date?: string;
  end_date?: string;
  pay_date?: string;
  pay_period_group_id?: string | null;
  payrate_frequency_id?: number | null;
}

export const usePayPeriodScheduleStore = defineStore('payPeriodSchedule', {
  state: () => ({
    payPeriodSchedules: [] as PayPeriodSchedule[],
    isLoading: false,
    isLoadingPayPeriodSchedules: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    error: null as string | null,
    payPeriodGroupId: null as string | null,
  }),

  getters: {},

  actions: {
    async fetchPayPeriodSchedules(page?: number, perPage?: number, payPeriodGroupId?: string | null) {
      if (this.isLoadingPayPeriodSchedules) return;

      this.isLoadingPayPeriodSchedules = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const queryParams = new URLSearchParams();

        // Add pay_period_group_id filter if provided
        const groupId = payPeriodGroupId ?? this.payPeriodGroupId;
        if (groupId) {
          queryParams.append('pay_period_group_id', groupId);
        }

        // Add pagination parameters
        const currentPage = page ?? this.currentPage;
        const itemsPerPage = perPage ?? 10;
        queryParams.append('page', currentPage.toString());
        queryParams.append('per_page', itemsPerPage.toString());

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/pay-period-schedules?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch pay period schedules: ${response.statusText}`);
        }

        const data = await response.json();

        // Handle paginated response
        if (data.data && Array.isArray(data.data)) {
          this.payPeriodSchedules = data.data;
          this.currentPage = data.current_page || 1;
          this.lastPage = data.last_page || 1;
          this.total = data.total || 0;
        } else if (Array.isArray(data)) {
          // Fallback for non-paginated response
          this.payPeriodSchedules = data;
        } else {
          this.payPeriodSchedules = [];
        }
      } catch (error) {
        console.error('Error fetching pay period schedules:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching pay period schedules';
      } finally {
        this.isLoadingPayPeriodSchedules = false;
      }
    },

    async createPayPeriodSchedule(
      id: string,
      start_date: string,
      end_date: string,
      pay_date: string,
      pay_period_group_id?: string | null,
      payrate_frequency_id?: number | null
    ) {
      if (this.isLoading) return false;

      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const body: CreatePayPeriodScheduleBody = {
          id,
          start_date,
          end_date,
          pay_date,
          pay_period_group_id: pay_period_group_id ?? null,
          payrate_frequency_id: payrate_frequency_id ?? null,
        };

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/pay-period-schedules`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to create pay period schedule: ${response.statusText}`);
        }

        const newSchedule = await response.json();
        this.payPeriodSchedules.push(newSchedule);
        return true;
      } catch (error) {
        console.error('Error creating pay period schedule:', error);
        this.error = error instanceof Error ? error.message : 'Error creating pay period schedule';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async updatePayPeriodSchedule(
      id: string,
      start_date?: string,
      end_date?: string,
      pay_date?: string,
      pay_period_group_id?: string | null,
      payrate_frequency_id?: number | null
    ) {
      if (this.isLoading) return false;

      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const body: UpdatePayPeriodScheduleBody = {};

        if (start_date !== undefined) body.start_date = start_date;
        if (end_date !== undefined) body.end_date = end_date;
        if (pay_date !== undefined) body.pay_date = pay_date;
        if (pay_period_group_id !== undefined) body.pay_period_group_id = pay_period_group_id;
        if (payrate_frequency_id !== undefined) body.payrate_frequency_id = payrate_frequency_id;

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/pay-period-schedules/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to update pay period schedule: ${response.statusText}`);
        }

        const updatedSchedule = await response.json();
        const index = this.payPeriodSchedules.findIndex((s) => s.id === id);
        if (index !== -1) {
          this.payPeriodSchedules[index] = updatedSchedule;
        }
        return true;
      } catch (error) {
        console.error('Error updating pay period schedule:', error);
        this.error = error instanceof Error ? error.message : 'Error updating pay period schedule';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async deletePayPeriodSchedule(id: string) {
      if (this.isLoading) return false;

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

        const response = await fetch(`${API_URL}/pay-period-schedules/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete pay period schedule: ${response.statusText}`);
        }

        this.payPeriodSchedules = this.payPeriodSchedules.filter((s) => s.id !== id);
        return true;
      } catch (error) {
        console.error('Error deleting pay period schedule:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting pay period schedule';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    setPayPeriodGroupId(groupId: string | null) {
      this.payPeriodGroupId = groupId;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePayPeriodScheduleStore, import.meta.hot));
}

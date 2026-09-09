<template>
  <div class="department-employees-panel">
    <div v-if="loading" class="text-caption text-grey-6">Loading employees…</div>

    <div v-else-if="employees.length === 0" class="text-caption text-grey-6">
      No employees in this department.
    </div>

    <div v-else class="department-employees-panel__chips">
      <q-chip
        v-for="employee in employees"
        :key="employee.id"
        dense
        outline
        color="primary"
      >
        {{ employee.label }}
      </q-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

type DepartmentEmployeeChip = {
  id: string;
  label: string;
};

type EmployeeSearchRow = {
  id: string;
  code?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  person?: {
    firstName?: string | null;
    lastName?: string | null;
  } | null;
};

const props = defineProps<{
  departmentId: number;
}>();

const $q = useQuasar();
const authStore = useAuthStore();

const loading = ref(false);
const employees = ref<DepartmentEmployeeChip[]>([]);

let fetchId = 0;

watch(
  () => props.departmentId,
  async (departmentId) => {
    employees.value = [];

    if (!departmentId) {
      return;
    }

    const currentFetchId = ++fetchId;
    loading.value = true;

    try {
      const headers: HeadersInit = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`;
      }

      const allRows: DepartmentEmployeeChip[] = [];
      let page = 1;
      let lastPage = 1;

      do {
        const queryParams = new URLSearchParams({
          per_page: '100',
          sort_by: 'lastName',
          sort_direction: 'asc',
          page: String(page),
          department_id: String(departmentId),
        });

        const response = await fetch(`${API_URL}/employees?${queryParams}`, { headers });
        if (!response.ok) {
          const body = await response.json().catch(() => ({})) as { message?: string };
          throw new Error(body.message || `Failed to load department employees (${response.status})`);
        }

        const data = await response.json() as {
          data?: EmployeeSearchRow[];
          current_page?: number;
          last_page?: number;
        };

        if (currentFetchId !== fetchId) {
          return;
        }

        const rows = Array.isArray(data.data) ? data.data : [];
        allRows.push(...rows.map(toChip));
        page = (data.current_page ?? page) + 1;
        lastPage = data.last_page ?? 1;
      } while (page <= lastPage);

      if (currentFetchId !== fetchId) {
        return;
      }

      employees.value = allRows.sort((left, right) => left.label.localeCompare(right.label));
    } catch (error) {
      if (currentFetchId === fetchId) {
        employees.value = [];
        $q.notify({
          type: 'negative',
          message: error instanceof Error ? error.message : 'Failed to load department employees.',
        });
      }
    } finally {
      if (currentFetchId === fetchId) {
        loading.value = false;
      }
    }
  },
  { immediate: true },
);

function toChip(employee: EmployeeSearchRow): DepartmentEmployeeChip {
  const firstName = employee.firstName ?? employee.person?.firstName ?? '';
  const lastName = employee.lastName ?? employee.person?.lastName ?? '';
  const name = `${firstName} ${lastName}`.trim();
  const label = name && employee.code
    ? `${name} (${employee.code})`
    : (name || employee.code || 'Employee');

  return {
    id: String(employee.id),
    label,
  };
}
</script>

<style scoped>
.department-employees-panel__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>

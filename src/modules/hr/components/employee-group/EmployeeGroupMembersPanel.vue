<template>
  <div class="employee-group-members-panel">
    <q-select
      :model-value="pendingEmployeeId"
      :options="employeeOptions"
      option-value="id"
      option-label="label"
      emit-value
      map-options
      use-input
      fill-input
      hide-selected
      clearable
      dense
      outlined
      label="Add employee"
      placeholder="Search employees"
      input-debounce="300"
      :loading="searching"
      :disable="!groupId || busy || loadingMembers"
      @filter="filterEmployees"
      @update:model-value="onSelectEmployee"
    >
      <template #prepend>
        <q-icon name="person_search" />
      </template>
      <template #option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.label }}</q-item-label>
            <q-item-label v-if="scope.opt.code" caption>{{ scope.opt.code }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>
      <template #no-option>
        <q-item>
          <q-item-section class="text-grey">
            {{ searching ? 'Searching…' : 'No matching employees' }}
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <div v-if="loadingMembers" class="q-mt-sm text-caption text-grey-6">Loading members…</div>

    <div v-else-if="members.length === 0" class="q-mt-sm text-caption text-grey-6">
      No members in this group yet.
    </div>

    <div v-else class="employee-group-members-panel__chips q-mt-sm">
      <q-chip
        v-for="member in members"
        :key="member.id"
        removable
        dense
        outline
        color="primary"
        :disable="busyMemberId === member.id"
        @remove="removeMember(member)"
      >
        {{ memberLabel(member) }}
      </q-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@core/stores/auth';
import {
  useEmployeeGroupStore,
  type EmployeeGroupMember,
} from '@hr/stores/employee-group-store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

type EmployeeOption = {
  id: string;
  label: string;
  code?: string | null;
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
  groupId: string;
}>();

const emit = defineEmits<{
  'members-changed': [];
}>();

const $q = useQuasar();
const authStore = useAuthStore();
const groupStore = useEmployeeGroupStore();

const loadingMembers = ref(false);
const searching = ref(false);
const busy = ref(false);
const busyMemberId = ref<string | null>(null);
const pendingEmployeeId = ref<string | null>(null);
const employeeOptions = ref<EmployeeOption[]>([]);

let searchFetchId = 0;

const members = computed(() => {
  const group = groupStore.groups.find((row) => row.id === props.groupId);
  return [...(group?.members ?? [])].sort((left, right) =>
    memberLabel(left).localeCompare(memberLabel(right)),
  );
});

const memberEmployeeIds = computed(() =>
  new Set(members.value.map((member) => String(member.employeeId))),
);

watch(
  () => props.groupId,
  async (groupId) => {
    pendingEmployeeId.value = null;
    employeeOptions.value = [];

    if (!groupId) {
      return;
    }

    loadingMembers.value = true;
    try {
      await groupStore.fetchGroup(groupId);
      await loadEmployeeOptions('');
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Failed to load group members.',
      });
    } finally {
      loadingMembers.value = false;
    }
  },
  { immediate: true },
);

function memberLabel(member: EmployeeGroupMember) {
  const name = (member.employeeName ?? '').trim();
  if (name && member.employeeCode) {
    return `${name} (${member.employeeCode})`;
  }
  return name || member.employeeCode || 'Employee';
}

function employeeOption(employee: EmployeeSearchRow): EmployeeOption {
  const firstName = employee.firstName ?? employee.person?.firstName ?? '';
  const lastName = employee.lastName ?? employee.person?.lastName ?? '';
  const name = `${firstName} ${lastName}`.trim();
  return {
    id: String(employee.id),
    label: name || employee.code || 'Employee',
    code: employee.code ?? null,
  };
}

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (authStore.token) {
    headers.Authorization = `Bearer ${authStore.token}`;
  }
  return headers;
}

async function loadEmployeeOptions(search: string): Promise<EmployeeOption[]> {
  const fetchId = ++searchFetchId;
  searching.value = true;

  const queryParams = new URLSearchParams({
    per_page: '50',
    sort_by: 'lastName',
    sort_direction: 'asc',
    page: '1',
  });

  const trimmed = search.trim();
  if (trimmed) {
    queryParams.append('search', trimmed);
  }

  try {
    const response = await fetch(`${API_URL}/employees?${queryParams}`, {
      headers: buildHeaders(),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      throw new Error(body.message || `Failed to search employees (${response.status})`);
    }

    const data = await response.json() as { data?: EmployeeSearchRow[] };
    if (fetchId !== searchFetchId) {
      return employeeOptions.value;
    }

    const rows = Array.isArray(data.data) ? data.data : [];
    const options = rows
      .filter((employee) => employee?.id && !memberEmployeeIds.value.has(String(employee.id)))
      .map(employeeOption);

    employeeOptions.value = options;
    return options;
  } catch (error) {
    if (fetchId === searchFetchId) {
      employeeOptions.value = [];
      $q.notify({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Failed to search employees.',
      });
    }
    return [];
  } finally {
    if (fetchId === searchFetchId) {
      searching.value = false;
    }
  }
}

function filterEmployees(value: string, update: (callback: () => void) => void) {
  void (async () => {
    const options = await loadEmployeeOptions(value);
    update(() => {
      employeeOptions.value = options;
    });
  })();
}

async function onSelectEmployee(employeeId: string | null) {
  pendingEmployeeId.value = null;

  if (!employeeId || !props.groupId) {
    return;
  }

  if (memberEmployeeIds.value.has(String(employeeId))) {
    return;
  }

  busy.value = true;
  try {
    await groupStore.addMember(props.groupId, employeeId);
    employeeOptions.value = employeeOptions.value.filter(
      (option) => String(option.id) !== String(employeeId),
    );
    emit('members-changed');
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to add employee to group.',
    });
  } finally {
    busy.value = false;
  }
}

async function removeMember(member: EmployeeGroupMember) {
  if (!props.groupId) {
    return;
  }

  busyMemberId.value = member.id;
  try {
    await groupStore.removeMember(props.groupId, member.id);
    emit('members-changed');
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to remove employee from group.',
    });
  } finally {
    busyMemberId.value = null;
  }
}
</script>

<style scoped>
.employee-group-members-panel__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>

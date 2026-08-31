<template>
  <q-dialog
    :model-value="modelValue"
    position="right"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <AppDialogCard>
      <AppDialogHeader>
        <div>
          <div class="text-h6">{{ group?.name ?? 'Group members' }}</div>
          <div v-if="group?.description" class="text-caption text-grey-7">{{ group.description }}</div>
        </div>
        <template #close>
          <q-btn icon="close" flat round dense @click="$emit('update:modelValue', false)" />
        </template>
      </AppDialogHeader>

      <AppDialogBody class="members-dialog-body">
        <div class="row q-col-gutter-md members-panels">
          <div class="col-6 members-panel">
            <div class="members-panel-search">
              <div class="text-subtitle2 text-weight-medium q-mb-xs">Available employees</div>
              <q-input
                v-model="availableEmployeeSearch"
                dense
                outlined
                clearable
                placeholder="Search by name or code"
                :disable="loadingAvailable"
              >
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>

            <div class="members-panel-content">
              <q-inner-loading :showing="loadingAvailable && availableEmployees.length === 0">
                <q-spinner color="primary" size="32px" />
              </q-inner-loading>

              <q-list v-if="filteredAvailableEmployees.length > 0" bordered separator dense class="available-employees-list">
                <q-item
                  v-for="employee in filteredAvailableEmployees"
                  :key="employee.id"
                  clickable
                  v-ripple
                  dense
                  @click="addEmployee(employee)"
                >
                  <q-item-section>
                    <q-item-label class="ellipsis">{{ employeeName(employee) }}</q-item-label>
                    <q-item-label v-if="employee.code" caption class="ellipsis">{{ employee.code }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn
                      flat
                      round
                      dense
                      icon="person_add"
                      color="primary"
                      size="sm"
                      @click.stop="addEmployee(employee)"
                    >
                      <q-tooltip>Add to group</q-tooltip>
                    </q-btn>
                  </q-item-section>
                </q-item>
              </q-list>

              <div v-else-if="!loadingAvailable" class="members-empty-state text-grey-6">
                No employees available to add.
              </div>

              <div v-if="availableEmployeesHasMore" class="q-pa-sm text-center">
                <q-btn
                  flat
                  dense
                  color="primary"
                  label="Load more"
                  :loading="loadingAvailable"
                  @click="loadMoreAvailableEmployees"
                />
              </div>
            </div>
          </div>

          <div class="col-6 members-panel">
            <div class="members-panel-search">
              <div class="text-subtitle2 text-weight-medium q-mb-xs">Group members</div>
              <q-input
                v-model="memberSearch"
                dense
                outlined
                clearable
                placeholder="Search members"
                :disable="loading"
              >
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>

            <div class="members-panel-content">
              <q-table
                flat
                bordered
                dense
                row-key="id"
                class="members-table"
                :rows="filteredMembers"
                :columns="columns"
                :loading="loading"
                no-data-label="No members in this group"
                hide-bottom
              >
                <template #body-cell-actions="props">
                  <q-td :props="props" class="text-right">
                    <q-btn
                      flat
                      round
                      dense
                      icon="person_remove"
                      color="negative"
                      size="sm"
                      @click.stop="removeMember(props.row)"
                    >
                      <q-tooltip>Remove from group</q-tooltip>
                    </q-btn>
                  </q-td>
                </template>
              </q-table>
            </div>
          </div>
        </div>
      </AppDialogBody>

      <AppDialogActions>
        <q-btn flat label="Cancel" color="grey" @click="$emit('update:modelValue', false)" />
        <q-btn color="primary" label="Save members" :loading="saving" @click="saveMembers" />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import { useAuthStore } from '@core/stores/auth';
import {
  useEmployeeGroupStore,
  type EmployeeGroup,
  type EmployeeGroupMember,
} from '@hr/stores/employee-group-store';
import type { CalendarEmployee } from '@hr/stores/calendar-store';
import { normalizeCalendarEmployees } from '@hr/utils/calendar-employment-utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';
const AVAILABLE_EMPLOYEES_PER_PAGE = 50;

const props = defineProps<{
  modelValue: boolean;
  group: EmployeeGroup | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const $q = useQuasar();
const authStore = useAuthStore();
const groupStore = useEmployeeGroupStore();

const loading = ref(false);
const saving = ref(false);
const loadingAvailable = ref(false);
const memberSearch = ref('');
const availableEmployeeSearch = ref('');
const availableEmployees = ref<CalendarEmployee[]>([]);
const availableEmployeesPage = ref(1);
const availableEmployeesHasMore = ref(false);
const draftMemberIds = ref<string[]>([]);
const draftMembers = ref<EmployeeGroupMember[]>([]);

let availableEmployeesFetchId = 0;
let availableSearchDebounce: ReturnType<typeof setTimeout> | null = null;

const columns: QTableProps['columns'] = [
  { name: 'employeeName', label: 'Employee', field: 'employeeName', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

const assignedMemberIds = computed(() => new Set(draftMemberIds.value.map((id) => String(id))));

const filteredAvailableEmployees = computed(() =>
  availableEmployees.value.filter((employee) => !assignedMemberIds.value.has(String(employee.id))),
);

const filteredMembers = computed(() => {
  const search = memberSearch.value.trim().toLowerCase();
  if (!search) {
    return draftMembers.value;
  }

  return draftMembers.value.filter((member) => {
    const haystack = `${member.employeeName ?? ''} ${member.employeeCode ?? ''}`.toLowerCase();
    return haystack.includes(search);
  });
});

watch(
  () => [props.modelValue, props.group?.id] as const,
  async () => {
    if (!props.modelValue || !props.group?.id) {
      return;
    }

    memberSearch.value = '';
    availableEmployeeSearch.value = '';
    loading.value = true;

    try {
      const group = await groupStore.fetchGroup(props.group.id);
      draftMemberIds.value = (group.members ?? []).map((member) => String(member.employeeId));
      draftMembers.value = (group.members ?? []).map((member) => ({
        ...member,
        employeeId: String(member.employeeId),
      }));
      await fetchAvailableEmployees(true);
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Failed to load group members.',
      });
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

watch(availableEmployeeSearch, () => {
  if (!props.modelValue) {
    return;
  }

  if (availableSearchDebounce) {
    clearTimeout(availableSearchDebounce);
  }

  availableSearchDebounce = setTimeout(() => {
    void fetchAvailableEmployees(true);
  }, 300);
});

function employeeName(employee: CalendarEmployee) {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

function employeeDisplayName(employee: CalendarEmployee) {
  const name = employeeName(employee);
  return employee.code ? `${name} (${employee.code})` : name;
}

async function fetchAvailableEmployees(reset = true) {
  const fetchId = ++availableEmployeesFetchId;
  loadingAvailable.value = true;

  const pageToFetch = reset ? 1 : availableEmployeesPage.value + 1;

  if (reset) {
    availableEmployeesPage.value = 1;
    availableEmployees.value = [];
    availableEmployeesHasMore.value = false;
  }

  const queryParams = new URLSearchParams({
    per_page: String(AVAILABLE_EMPLOYEES_PER_PAGE),
    sort_by: 'lastName',
    sort_direction: 'asc',
    page: String(pageToFetch),
  });

  const search = availableEmployeeSearch.value.trim();
  if (search) {
    queryParams.append('search', search);
  }

  try {
    const headers: HeadersInit = {
      Accept: 'application/json',
    };
    if (authStore.token) {
      headers.Authorization = `Bearer ${authStore.token}`;
    }

    const response = await fetch(`${API_URL}/employees?${queryParams}`, { headers });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || `Failed to fetch employees: ${response.status}`);
    }

    const data = await response.json();

    if (fetchId !== availableEmployeesFetchId) {
      return;
    }

    const pageEmployees = normalizeCalendarEmployees(Array.isArray(data.data) ? data.data : []);

    if (reset) {
      availableEmployees.value = pageEmployees;
    } else {
      availableEmployees.value = [...availableEmployees.value, ...pageEmployees];
    }

    availableEmployeesPage.value = data.current_page ?? pageToFetch;
    const lastPage = data.last_page ?? 1;
    availableEmployeesHasMore.value = availableEmployeesPage.value < lastPage;
  } catch (error) {
    if (fetchId === availableEmployeesFetchId) {
      $q.notify({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Failed to load employees.',
      });
    }
  } finally {
    if (fetchId === availableEmployeesFetchId) {
      loadingAvailable.value = false;
    }
  }
}

async function loadMoreAvailableEmployees() {
  if (!availableEmployeesHasMore.value || loadingAvailable.value) {
    return;
  }

  await fetchAvailableEmployees(false);
}

function addEmployee(employee: CalendarEmployee) {
  const employeeId = String(employee.id);
  if (assignedMemberIds.value.has(employeeId)) {
    return;
  }

  draftMemberIds.value.push(employeeId);
  draftMembers.value.push({
    id: `draft-${employeeId}`,
    employeeGroupId: props.group?.id ?? '',
    employeeId,
    employeeCode: employee.code ?? null,
    employeeName: employeeDisplayName(employee),
  });
}

function removeMember(member: EmployeeGroupMember) {
  const employeeId = String(member.employeeId);
  draftMemberIds.value = draftMemberIds.value.filter((id) => String(id) !== employeeId);
  draftMembers.value = draftMembers.value.filter((row) => String(row.employeeId) !== employeeId);
}

async function saveMembers() {
  if (!props.group?.id) {
    return;
  }

  saving.value = true;

  try {
    await groupStore.syncMembers(props.group.id, draftMemberIds.value);
    emit('saved');
    emit('update:modelValue', false);
    $q.notify({ type: 'positive', message: 'Group members updated.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save group members.',
    });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.members-dialog-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.members-panels {
  flex: 1;
  min-height: 0;
  height: 100%;
}

.members-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.members-panel-search {
  flex-shrink: 0;
  margin-bottom: 12px;
}

.members-panel-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.available-employees-list {
  flex: 1;
  overflow-y: auto;
}

.members-table {
  flex: 1;
  min-height: 0;
}

.members-table :deep(.q-table__middle) {
  flex: 1;
  overflow-y: auto;
}

.members-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  font-size: 13px;
}
</style>

<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">Leave List</div>

    <q-banner v-if="accessChecked && !canAccess" class="bg-grey-2 text-grey-8 q-mb-md" rounded>
      Leave List is available to supervisors with subordinates, and to HR / super admins.
    </q-banner>

    <template v-else>
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle2 q-mb-md">Search options</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-3">
              <DateField v-model="filters.fromDate" label="From date" />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <DateField v-model="filters.toDate" label="To date" />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-select
                v-model="filters.employeeId"
                :options="employeeOptions"
                option-value="id"
                option-label="label"
                emit-value
                map-options
                use-input
                input-debounce="200"
                outlined
                dense
                clearable
                label="Employee"
                :loading="employeeStore.isLoading"
                @filter="filterEmployees"
              />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <DepartmentSelect
                v-model="filters.departmentId"
                label="Department"
                clearable
              />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <WorksiteSelect
                v-model="filters.worksiteId"
                label="Work site"
                clearable
                :show-add-new="false"
                :show-edit="false"
              />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-select
                v-model="filters.leaveTypeId"
                :options="leaveTypeOptions"
                option-value="id"
                option-label="name"
                emit-value
                map-options
                use-input
                input-debounce="200"
                outlined
                dense
                clearable
                label="Leave type"
                :loading="leaveTypeStore.isLoadingLeaveTypes"
                @filter="filterLeaveTypes"
              />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-select
                v-model="filters.statusCode"
                :options="statusOptions"
                emit-value
                map-options
                outlined
                dense
                clearable
                label="Leave status"
              />
            </div>
          </div>

          <div class="row q-gutter-sm q-mt-md">
            <q-btn
              color="primary"
              icon="search"
              label="Search"
              :loading="store.isLoadingTeamLeaves"
              @click="onSearch"
            />
            <q-btn
              flat
              color="primary"
              icon="restart_alt"
              label="Reset"
              :disable="store.isLoadingTeamLeaves"
              @click="onReset"
            />
            <q-btn
              outline
              color="primary"
              icon="file_download"
              label="Export Excel"
              :loading="store.isExportingTeamLeaves"
              :disable="!canAccess"
              @click="onExport"
            />
          </div>
        </q-card-section>
      </q-card>

      <q-table
        flat
        bordered
        dense
        row-key="id"
        :rows="store.teamLeaves"
        :columns="columns"
        :loading="store.isLoadingTeamLeaves"
        v-model:pagination="pagination"
        :rows-per-page-options="[10, 15, 25, 50]"
        server-side
        @request="onRequest"
        no-data-label="No leave applications"
      >
        <template #body-cell-netLeaveBalance="props">
          <q-td :props="props">
            {{ formatBalance(props.row.netLeaveBalance) }}
          </q-td>
        </template>

        <template #body-cell-requestedDays="props">
          <q-td :props="props">
            {{ formatDays(props.row.requestedDays) }}
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge
              :color="leaveStatusColor(props.row.statusCode)"
              :label="formatLeaveStatus(props.row.statusCode, props.row.statusName)"
            />
          </q-td>
        </template>

        <template #body-cell-comments="props">
          <q-td :props="props">
            <div v-if="props.row.notes" class="text-caption">
              <span class="text-grey-7">Request:</span> {{ props.row.notes }}
            </div>
            <div v-if="props.row.statusNote" class="text-caption">
              <span class="text-grey-7">Decision:</span> {{ props.row.statusNote }}
            </div>
            <div
              v-if="props.row.attachments?.length"
              class="text-caption q-gutter-xs"
            >
              <a
                v-for="file in props.row.attachments"
                :key="file.id"
                class="text-primary"
                :href="file.fileUrl || '#'"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ file.fileName }}
              </a>
            </div>
            <span
              v-if="!props.row.notes && !props.row.statusNote && !props.row.attachments?.length"
              class="text-grey-5"
            >—</span>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" class="text-right">
            <div class="action-buttons">
              <q-btn
                v-if="props.row.canApprove"
                flat
                round
                dense
                icon="check"
                color="positive"
                size="sm"
                @click="promptAction(props.row, 'approve')"
              >
                <q-tooltip>Approve</q-tooltip>
              </q-btn>
              <q-btn
                v-if="props.row.canReject"
                flat
                round
                dense
                icon="close"
                color="negative"
                size="sm"
                @click="promptAction(props.row, 'reject')"
              >
                <q-tooltip>Reject</q-tooltip>
              </q-btn>
              <q-btn
                v-if="props.row.canCancel"
                flat
                round
                dense
                icon="block"
                color="grey"
                size="sm"
                @click="promptAction(props.row, 'cancel')"
              >
                <q-tooltip>Cancel</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import DateField from '@core/components/common/DateField.vue';
import DepartmentSelect from '@hr/components/department/DepartmentSelect.vue';
import WorksiteSelect from '@hr/components/worksite/WorksiteSelect.vue';
import {
  useEmployeeLeaveStore,
  type TeamLeaveFilters,
  type TeamLeaveRow,
} from '@hr/stores/employee-leave-store';
import { useEmployeeStore } from '@hr/stores/employee-store';
import { useLeaveTypeStore } from '@hr/stores/leave-type-store';
import { exportTeamLeavesToExcel } from '@hr/utils/leave-list-export';
import { formatLeaveStatus, leaveStatusColor } from '@hr/utils/leave-status';

const $q = useQuasar();
const store = useEmployeeLeaveStore();
const employeeStore = useEmployeeStore();
const leaveTypeStore = useLeaveTypeStore();

const accessChecked = ref(false);
const employeeFilterText = ref('');
const leaveTypeFilterText = ref('');

const filters = reactive<TeamLeaveFilters>({
  fromDate: null,
  toDate: null,
  employeeId: null,
  departmentId: null,
  worksiteId: null,
  leaveTypeId: null,
  statusCode: null,
});

const canAccess = computed(() => Boolean(store.teamAccess?.canAccess));

const pagination = ref({
  page: 1,
  rowsPerPage: 15,
  rowsNumber: 0,
});

const statusOptions = [
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Pending supervisor approval', value: 'PENDING_SUPERVISOR_APPROVAL' },
  { label: 'Pending approval', value: 'PENDING_APPROVAL' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Taken', value: 'TAKEN' },
  { label: 'Rejected', value: 'REJECTED' },
];

const columns: QTableProps['columns'] = [
  { name: 'employeeName', label: 'Employee', field: 'employeeName', align: 'left' },
  { name: 'dateRange', label: 'Date range', field: 'dateRange', align: 'left' },
  { name: 'leaveType', label: 'Leave type', field: 'leaveType', align: 'left' },
  { name: 'netLeaveBalance', label: 'Net leave balance (days)', field: 'netLeaveBalance', align: 'right' },
  { name: 'requestedDays', label: 'Requested days', field: 'requestedDays', align: 'right' },
  { name: 'status', label: 'Status', field: 'statusCode', align: 'left' },
  { name: 'comments', label: 'Comments', field: 'notes', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
];

const employeeOptions = computed(() => {
  const needle = employeeFilterText.value.trim().toLowerCase();
  return employeeStore.employees
    .map((employee) => ({
      id: employee.id,
      label: formatEmployeeOptionLabel(employee),
    }))
    .filter((option) => !needle || option.label.toLowerCase().includes(needle));
});

const leaveTypeOptions = computed(() => {
  const needle = leaveTypeFilterText.value.trim().toLowerCase();
  return leaveTypeStore.leaveTypes.filter(
    (type) => !needle || (type.name ?? '').toLowerCase().includes(needle),
  );
});

function formatEmployeeOptionLabel(employee: {
  code?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
}): string {
  const lastName = (employee.lastName ?? '').trim();
  const firstName = (employee.firstName ?? '').trim();
  const middleName = (employee.middleName ?? '').trim();
  if (lastName) {
    const given = [firstName, middleName].filter(Boolean).join(' ');
    return given ? `${lastName}, ${given}` : lastName;
  }
  return [employee.code, firstName, lastName].filter(Boolean).join(' — ') || 'Employee';
}

function formatDays(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 2);
}

function formatBalance(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return formatDays(value);
}

function syncFiltersToStore() {
  store.teamFilters = {
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    employeeId: filters.employeeId,
    departmentId: filters.departmentId,
    worksiteId: filters.worksiteId,
    leaveTypeId: filters.leaveTypeId,
    statusCode: filters.statusCode,
  };
}

async function reload(page = pagination.value.page, rowsPerPage = pagination.value.rowsPerPage) {
  syncFiltersToStore();
  await store.fetchTeamLeaves(page, rowsPerPage);
  pagination.value.page = store.teamCurrentPage;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.rowsNumber = store.teamTotal;
}

async function onRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
  await reload(props.pagination.page, props.pagination.rowsPerPage);
}

function onSearch() {
  void reload(1, pagination.value.rowsPerPage);
}

function onReset() {
  filters.fromDate = null;
  filters.toDate = null;
  filters.employeeId = null;
  filters.departmentId = null;
  filters.worksiteId = null;
  filters.leaveTypeId = null;
  filters.statusCode = null;
  store.resetTeamFilters();
  void reload(1, pagination.value.rowsPerPage);
}

async function onExport() {
  syncFiltersToStore();
  const rows = await store.fetchTeamLeavesForExport();
  if (!rows.length) {
    $q.notify({
      type: 'warning',
      message: store.error || 'No leave records to export for the current filters.',
    });
    return;
  }

  exportTeamLeavesToExcel(rows);
  $q.notify({
    type: 'positive',
    message: `Exported ${rows.length} leave record${rows.length === 1 ? '' : 's'}.`,
  });
}

function filterEmployees(val: string, update: (callback: () => void) => void) {
  update(() => {
    employeeFilterText.value = val;
  });
}

function filterLeaveTypes(val: string, update: (callback: () => void) => void) {
  update(() => {
    leaveTypeFilterText.value = val;
  });
}

function promptAction(row: TeamLeaveRow, action: 'approve' | 'reject' | 'cancel') {
  const labels = {
    approve: 'Approve',
    reject: 'Reject',
    cancel: 'Cancel',
  } as const;

  $q.dialog({
    title: `${labels[action]} leave`,
    message: `${labels[action]} leave for ${row.employeeName} (${row.dateRange}). You may leave a comment.`,
    prompt: {
      model: row.statusNote ?? '',
      type: 'textarea',
      label: 'Comment',
      outlined: true,
      autogrow: true,
    },
    cancel: true,
    persistent: true,
    ok: {
      label: labels[action],
      color: action === 'approve' ? 'positive' : action === 'reject' ? 'negative' : 'primary',
    },
  }).onOk((note: string) => {
    void submitAction(row, action, note);
  });
}

async function submitAction(
  row: TeamLeaveRow,
  action: 'approve' | 'reject' | 'cancel',
  note: string,
) {
  const updated = await store.updateLeaveStatus(row.id, action, note?.trim() || null);
  if (!updated) {
    $q.notify({
      type: 'negative',
      message: store.error || `Failed to ${action} leave.`,
    });
    return;
  }

  $q.notify({
    type: 'positive',
    message: `Leave ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'cancelled'}.`,
  });
  await reload();
}

onMounted(async () => {
  await store.fetchTeamAccess();
  accessChecked.value = true;

  employeeStore.perPage = 100;
  await Promise.all([
    employeeStore.employees.length ? Promise.resolve() : employeeStore.fetchEmployees(true),
    leaveTypeStore.leaveTypes.length ? Promise.resolve() : leaveTypeStore.fetchLeaveTypes(),
  ]);

  if (store.teamAccess?.canAccess) {
    await reload(1, pagination.value.rowsPerPage);
  }
});
</script>

<style scoped>
.action-buttons {
  display: flex;
  gap: 2px;
  justify-content: flex-end;
}
</style>

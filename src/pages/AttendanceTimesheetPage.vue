<template>
  <div class="attendance-page q-pa-md">
    <div class="row items-start justify-between q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm">
        <div class="row items-center q-gutter-xs text-caption text-primary text-weight-medium q-mb-xs">
          <q-icon name="work_history" size="16px" />
          <span>Payroll preparation</span>
        </div>
        <div class="text-h4 text-weight-bold">Attendance to Payroll</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          {{ activeTabMeta.title }} · {{ activeTabMeta.description }}
        </div>
      </div>
      <q-btn
        v-if="activeTab !== 'import'"
        unelevated
        color="primary"
        icon="refresh"
        label="Refresh data"
        :loading="isLoadingClockingLogs || isLoadingEmployeeSummaries"
        @click="refreshActiveTab"
      />
    </div>

    <q-banner v-if="error" rounded class="bg-red-1 text-red-9 q-mb-md">
      <template #avatar><q-icon name="error_outline" /></template>
      <div class="text-weight-medium">Unable to complete the request</div>
      <div class="text-caption">{{ error }}</div>
    </q-banner>

    <attendance-period-control
      :active-tab="activeTab"
      :pay-periods="payPeriods"
      :selected-pay-period-id="selectedPayPeriodId"
      :is-loading-pay-periods="isLoadingPayPeriods"
      :issue-count="timesheetIssueCount"
      @update:selected-pay-period-id="onSelectedPayPeriodUpdate"
      @generate="openProcessingDialog"
      @review-issues="reviewTimesheetIssues"
    />

    <attendance-workflow-steps
      :active-tab="activeTab"
      :import-complete="Boolean(lastImportResult?.inserted)"
      :generated-count="lastProcessResult?.processedTimesheets ?? timesheetSummary.timesheetCount"
      :pending-count="timesheetPendingCount"
      :issue-count="timesheetIssueCount"
    />

    <q-tab-panels v-model="activeTab" class="bg-transparent">
      <q-tab-panel name="logs" class="q-pa-none">
        <attendance-clocking-logs-tab
          :filter="clockingFilter"
          :clocking-logs="clockingLogs"
          :is-loading-clocking-logs="isLoadingClockingLogs"
          :pagination="clockingLogPagination"
          :last-page="clockingLastPage"
          :last-process-result="lastProcessResult"
          @update:filter="onClockingFilterUpdate"
          @apply-filter="applyClockingFilter"
          @reset-filter="resetClockingFilter"
          @load-page="loadClockingLogs"
        />
      </q-tab-panel>

      <q-tab-panel name="import" class="q-pa-none">
        <attendance-import-tab
          :import-file="importFile"
          :default-device-id="defaultDeviceId"
          :has-header="hasHeader"
          :is-importing-file="isImportingFile"
          :last-import-result="lastImportResult"
          @update:import-file="onImportFileUpdate"
          @update:default-device-id="onDefaultDeviceIdUpdate"
          @update:has-header="onHasHeaderUpdate"
          @import-staged-rows="importStagedRows"
        />
      </q-tab-panel>

      <q-tab-panel name="timesheets" class="q-pa-none">
        <attendance-timesheets-tab
          :filter="timesheetFilter"
          :pay-periods="payPeriods"
          :employee-summaries="employeeTimesheetSummaries"
          :summary="timesheetSummary"
          :is-loading-timesheets="isLoadingEmployeeSummaries"
          :is-loading-pay-periods="isLoadingPayPeriods"
          :pagination="employeeSummaryPagination"
          :last-page="timesheetLastPage"
          @update:filter="onTimesheetFilterUpdate"
          @apply-filter="applyTimesheetFilter"
          @reset-filter="resetTimesheetFilter"
          @load-page="loadTimesheets"
          @review-issues="reviewTimesheetIssues"
          @view-details="openEmployeeDetails"
        />
      </q-tab-panel>
    </q-tab-panels>

    <employee-timesheet-detail-dialog
      :model-value="employeeDetailDialogOpen"
      :summary="selectedEmployeeSummary"
      :details="employeeTimesheetDetails"
      :start-date="timesheetFilter.startDate"
      :end-date="timesheetFilter.endDate"
      :is-loading="isLoadingEmployeeDetails"
      :is-updating-approval="isUpdatingApproval"
      @update:model-value="employeeDetailDialogOpen = $event"
      @request-approval="handleApprovalRequest"
      @approve-clean-pending="approveCleanPending"
    />

    <timesheet-approval-dialog
      :model-value="approvalDialogOpen"
      :target="approvalTarget"
      :action="approvalAction"
      :remarks="approvalRemarks"
      :is-updating-approval="isUpdatingApproval"
      @update:model-value="onApprovalDialogUpdate"
      @update:remarks="onApprovalRemarksUpdate"
      @submit="submitApproval"
    />

    <timesheet-processing-dialog
      :model-value="processingDialogOpen"
      :pay-periods="payPeriods"
      :selected-pay-period-id="selectedPayPeriodId"
      :start-date="processStartDate"
      :end-date="processEndDate"
      :biometric-user-id="processingBiometricUserId"
      :overtime-threshold-hours="overtimeThresholdOverride"
      :is-loading-pay-periods="isLoadingPayPeriods"
      :is-processing="isProcessingLogs"
      @update:model-value="processingDialogOpen = $event"
      @update:selected-pay-period-id="onSelectedPayPeriodUpdate"
      @update:start-date="processStartDate = $event"
      @update:end-date="processEndDate = $event"
      @update:biometric-user-id="processingBiometricUserId = $event"
      @update:overtime-threshold-hours="overtimeThresholdOverride = $event"
      @submit="processClockingLogs"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import AttendanceClockingLogsTab from 'src/components/attendance/AttendanceClockingLogsTab.vue';
import AttendancePeriodControl from 'src/components/attendance/AttendancePeriodControl.vue';
import AttendanceTimesheetsTab from 'src/components/attendance/AttendanceTimesheetsTab.vue';
import AttendanceWorkflowSteps from 'src/components/attendance/AttendanceWorkflowSteps.vue';
import EmployeeTimesheetDetailDialog from 'src/components/attendance/EmployeeTimesheetDetailDialog.vue';
import TimesheetApprovalDialog from 'src/components/attendance/TimesheetApprovalDialog.vue';
import TimesheetProcessingDialog from 'src/components/attendance/TimesheetProcessingDialog.vue';
import type {
  AttendanceTab,
  ClockingFilterForm,
  TimesheetApprovalAction,
  TimesheetFilterForm,
} from 'src/components/attendance/types';
import {
  useAttendanceStore,
  type EmployeeTimesheetSummary,
  type TimesheetRow,
} from 'src/stores/attendance-store';
import type { ClockingImportPayloadRow } from 'src/utils/clocking-import-staging';

const AttendanceImportTab = defineAsyncComponent(
  () => import('src/components/attendance/AttendanceImportTab.vue'),
);
const attendanceStore = useAttendanceStore();
const $q = useQuasar();
const router = useRouter();

const props = withDefaults(
  defineProps<{
    initialTab?: AttendanceTab;
  }>(),
  {
    initialTab: 'logs',
  },
);

const {
  clockingLogs,
  employeeTimesheetSummaries,
  employeeTimesheetDetails,
  timesheetSummary,
  clockingLogPagination,
  employeeSummaryPagination,
  lastImportResult,
  lastProcessResult,
  payPeriods,
  isLoadingClockingLogs,
  isLoadingEmployeeSummaries,
  isLoadingEmployeeDetails,
  isLoadingPayPeriods,
  isImportingFile,
  isProcessingLogs,
  isUpdatingApproval,
  error,
} = storeToRefs(attendanceStore);

const activeTab = ref<AttendanceTab>(props.initialTab);
const hasHeader = ref(true);
const importFile = ref<File | null>(null);
const defaultDeviceId = ref('');
const processingDialogOpen = ref(false);
const selectedPayPeriodId = ref<string | null>(null);
const processStartDate = ref('');
const processEndDate = ref('');
const processingBiometricUserId = ref('');
const overtimeThresholdOverride = ref<number | null>(null);

const approvalDialogOpen = ref(false);
const approvalTarget = ref<TimesheetRow | null>(null);
const approvalAction = ref<TimesheetApprovalAction>('APPROVED');
const approvalRemarks = ref('');
const employeeDetailDialogOpen = ref(false);
const selectedEmployeeSummary = ref<EmployeeTimesheetSummary | null>(null);

const clockingFilter = ref<ClockingFilterForm>({
  startDate: '',
  endDate: '',
  biometricUserId: '',
  deviceId: '',
});

const timesheetFilter = ref<TimesheetFilterForm>({
  payPeriodScheduleId: null,
  startDate: '',
  endDate: '',
  approvalStatus: null,
  workingStatus: null,
  payType: null,
  issuesOnly: false,
});

const clockingLastPage = computed(() =>
  Math.max(1, Math.ceil(clockingLogPagination.value.rowsNumber / clockingLogPagination.value.rowsPerPage || 1)),
);
const timesheetLastPage = computed(() =>
  Math.max(
    1,
    Math.ceil(employeeSummaryPagination.value.rowsNumber / employeeSummaryPagination.value.rowsPerPage || 1),
  ),
);
const timesheetIssueCount = computed(() =>
  timesheetSummary.value.issueCount,
);
const timesheetPendingCount = computed(
  () => timesheetSummary.value.pendingCount,
);
const activeTabMeta = computed(() => {
  const tabs: Record<AttendanceTab, { title: string; description: string }> = {
    logs: {
      title: 'Generate timesheets',
      description: 'Confirm the selected period, then calculate regular and overtime hours.',
    },
    import: {
      title: 'Import attendance',
      description: 'Upload the biometric export and correct only records that need attention.',
    },
    timesheets: {
      title: 'Review for payroll',
      description: 'Resolve exceptions first, then approve clean employee timesheets.',
    },
  };

  return tabs[activeTab.value];
});

function onClockingFilterUpdate(nextFilter: ClockingFilterForm) {
  clockingFilter.value = nextFilter;
}

function onTimesheetFilterUpdate(nextFilter: TimesheetFilterForm) {
  if (nextFilter.payPeriodScheduleId !== timesheetFilter.value.payPeriodScheduleId) {
    selectedPayPeriodId.value = nextFilter.payPeriodScheduleId;
    const period = payPeriods.value.find((item) => item.id === nextFilter.payPeriodScheduleId);
    nextFilter = {
      ...nextFilter,
      startDate: period?.startDate ?? '',
      endDate: period?.endDate ?? '',
    };
  }

  timesheetFilter.value = nextFilter;
}

function syncSelectedPayPeriod(value: string | null) {
  selectedPayPeriodId.value = value;
  const period = payPeriods.value.find((item) => item.id === value);

  if (period) {
    processStartDate.value = period.startDate;
    processEndDate.value = period.endDate;
    clockingFilter.value = {
      ...clockingFilter.value,
      startDate: period.startDate,
      endDate: period.endDate,
    };
    timesheetFilter.value = {
      ...timesheetFilter.value,
      payPeriodScheduleId: period.id,
      startDate: period.startDate,
      endDate: period.endDate,
    };
  }
}

async function onSelectedPayPeriodUpdate(value: string | null) {
  syncSelectedPayPeriod(value);

  if (activeTab.value === 'logs') {
    await Promise.all([loadClockingLogs(1), loadTimesheets(1)]);
    return;
  }

  await loadTimesheets(1);
}

function onImportFileUpdate(file: File | null) {
  importFile.value = file;
  attendanceStore.lastImportResult = null;
}

function onDefaultDeviceIdUpdate(value: string) {
  defaultDeviceId.value = value;
}

function onHasHeaderUpdate(value: boolean) {
  hasHeader.value = value;
}

function onApprovalDialogUpdate(value: boolean) {
  approvalDialogOpen.value = value;
}

function onApprovalRemarksUpdate(value: string) {
  approvalRemarks.value = value;
}

async function loadClockingLogs(page = 1) {
  await attendanceStore.fetchClockingLogs(
    {
      startDate: clockingFilter.value.startDate || undefined,
      endDate: clockingFilter.value.endDate || undefined,
      biometricUserId: clockingFilter.value.biometricUserId || undefined,
      deviceId: clockingFilter.value.deviceId || undefined,
    },
    page,
  );
}

async function loadTimesheets(page = 1) {
  await attendanceStore.fetchEmployeeTimesheetSummaries(timesheetApiFilters(), page);
}

function timesheetApiFilters(employeeId?: string) {
  return {
    startDate: timesheetFilter.value.startDate || undefined,
    endDate: timesheetFilter.value.endDate || undefined,
    employeeId,
    approvalStatus: timesheetFilter.value.approvalStatus || undefined,
    workingStatus: timesheetFilter.value.workingStatus || undefined,
    payType: timesheetFilter.value.payType || undefined,
    issuesOnly: timesheetFilter.value.issuesOnly,
  };
}

async function openEmployeeDetails(summary: EmployeeTimesheetSummary) {
  selectedEmployeeSummary.value = summary;
  employeeDetailDialogOpen.value = true;
  await attendanceStore.fetchEmployeeTimesheetDetails(summary.employeeId, timesheetApiFilters());
}

async function reloadEmployeeDetails() {
  if (!selectedEmployeeSummary.value) {
    return;
  }

  await attendanceStore.fetchEmployeeTimesheetDetails(
    selectedEmployeeSummary.value.employeeId,
    timesheetApiFilters(),
  );
  selectedEmployeeSummary.value =
    employeeTimesheetSummaries.value.find(
      (summary) => summary.employeeId === selectedEmployeeSummary.value?.employeeId,
    ) ?? selectedEmployeeSummary.value;
}

async function applyClockingFilter() {
  await loadClockingLogs(1);
}

async function applyTimesheetFilter() {
  await loadTimesheets(1);
}

async function resetClockingFilter() {
  const period = payPeriods.value.find((item) => item.id === selectedPayPeriodId.value);
  clockingFilter.value = {
    startDate: period?.startDate ?? '',
    endDate: period?.endDate ?? '',
    biometricUserId: '',
    deviceId: '',
  };
  await loadClockingLogs(1);
}

async function resetTimesheetFilter() {
  const period = payPeriods.value.find((item) => item.id === selectedPayPeriodId.value);
  timesheetFilter.value = {
    payPeriodScheduleId: period?.id ?? null,
    startDate: period?.startDate ?? '',
    endDate: period?.endDate ?? '',
    approvalStatus: null,
    workingStatus: null,
    payType: null,
    issuesOnly: false,
  };
  await loadTimesheets(1);
}

async function refreshActiveTab() {
  if (activeTab.value === 'logs') {
    await loadClockingLogs(clockingLogPagination.value.page);
    return;
  }

  if (activeTab.value === 'timesheets') {
    await loadTimesheets(employeeSummaryPagination.value.page);

    if (employeeDetailDialogOpen.value) {
      await reloadEmployeeDetails();
    }
  }
}

async function importStagedRows(rows: ClockingImportPayloadRow[]) {
  if (!rows.length) {
    $q.notify({ type: 'negative', message: 'No valid clocking records are ready to import.' });
    return;
  }

  const result = await attendanceStore.importClockingRows(rows);

  if (!result) {
    $q.notify({ type: 'negative', message: error.value ?? 'Clocking import failed.' });
    return;
  }

  $q.notify({
    type: 'positive',
    message: `Imported ${result.inserted} logs. Skipped ${result.duplicatesSkipped} duplicates.`,
  });

  importFile.value = null;
  const importedDates = rows
    .map((row) => row.punchDateTime?.slice(0, 10))
    .filter((value): value is string => Boolean(value))
    .sort();

  if (importedDates.length) {
    clockingFilter.value.startDate = importedDates[0] ?? '';
    clockingFilter.value.endDate = importedDates[importedDates.length - 1] ?? '';
    const matchingPeriod = payPeriods.value.find(
      (period) =>
        period.startDate === clockingFilter.value.startDate &&
        period.endDate === clockingFilter.value.endDate,
    );

    if (matchingPeriod) {
      syncSelectedPayPeriod(matchingPeriod.id);
    } else {
      selectedPayPeriodId.value = null;
      processStartDate.value = clockingFilter.value.startDate;
      processEndDate.value = clockingFilter.value.endDate;
      timesheetFilter.value = {
        ...timesheetFilter.value,
        payPeriodScheduleId: null,
        startDate: clockingFilter.value.startDate,
        endDate: clockingFilter.value.endDate,
      };
    }
  }

  await router.push('/payroll/clocking-logs');
  await loadClockingLogs(1);
}

function openProcessingDialog() {
  processingBiometricUserId.value = clockingFilter.value.biometricUserId;
  overtimeThresholdOverride.value = null;

  const matchingPeriod = payPeriods.value.find(
    (period) =>
      period.startDate === clockingFilter.value.startDate &&
      period.endDate === clockingFilter.value.endDate,
  );
  const selectedPeriod = payPeriods.value.find((period) => period.id === selectedPayPeriodId.value);
  const today = localDateString(new Date());
  const currentPeriod = payPeriods.value.find(
    (period) => period.startDate <= today && period.endDate >= today,
  );
  const hasAdHocRange = Boolean(
    clockingFilter.value.startDate &&
    clockingFilter.value.endDate &&
    !matchingPeriod,
  );
  const period =
    selectedPeriod ??
    matchingPeriod ??
    (hasAdHocRange ? undefined : currentPeriod ?? payPeriods.value[0]);

  selectedPayPeriodId.value = period?.id ?? null;
  processStartDate.value = period?.startDate ?? clockingFilter.value.startDate;
  processEndDate.value = period?.endDate ?? clockingFilter.value.endDate;
  processingDialogOpen.value = true;
}

async function processClockingLogs() {
  const result = await attendanceStore.processClockingLogs({
    payPeriodScheduleId: selectedPayPeriodId.value || undefined,
    startDate: selectedPayPeriodId.value ? undefined : processStartDate.value || undefined,
    endDate: selectedPayPeriodId.value ? undefined : processEndDate.value || undefined,
    biometricUserId: processingBiometricUserId.value || undefined,
    overtimeThresholdHours: overtimeThresholdOverride.value ?? undefined,
    queue: false,
  });

  if (!result) {
    $q.notify({ type: 'negative', message: error.value ?? 'Processing failed.' });
    return;
  }

  $q.notify({
    type: 'positive',
    message: `Generated ${result.processedTimesheets ?? 0} timesheets: ${Number(result.regularHours ?? 0).toFixed(2)} regular and ${Number(result.overtimeHours ?? 0).toFixed(2)} OT hours.`,
  });

  const effectivePeriod = result.payPeriod;
  const effectiveStartDate = effectivePeriod?.startDate ?? processStartDate.value;
  const effectiveEndDate = effectivePeriod?.endDate ?? processEndDate.value;

  processingDialogOpen.value = false;
  timesheetFilter.value = {
    ...timesheetFilter.value,
    payPeriodScheduleId: effectivePeriod?.id ?? selectedPayPeriodId.value,
    startDate: effectiveStartDate,
    endDate: effectiveEndDate,
    approvalStatus: 'PENDING',
    workingStatus: null,
    payType: null,
    issuesOnly: false,
  };
  await router.push('/payroll/timesheets');
  await loadTimesheets(1);
}

async function reviewTimesheetIssues() {
  timesheetFilter.value = {
    ...timesheetFilter.value,
    approvalStatus: 'PENDING',
    issuesOnly: true,
  };

  if (activeTab.value !== 'timesheets') {
    await router.push('/payroll/timesheets');
  }

  await loadTimesheets(1);
}

function approveCleanPending(timesheetIds: string[]) {
  if (!timesheetIds.length) {
    return;
  }

  $q.dialog({
    title: 'Approve clean timesheets?',
    message: `${timesheetIds.length} clean pending timesheet${timesheetIds.length === 1 ? '' : 's'} on this page will be approved for payroll.`,
    cancel: true,
    persistent: true,
    ok: {
      label: `Approve ${timesheetIds.length}`,
      color: 'positive',
      icon: 'done_all',
    },
  }).onOk(() => {
    void submitCleanPendingApproval(timesheetIds);
  });
}

async function submitCleanPendingApproval(timesheetIds: string[]) {
  const result = await attendanceStore.updateBulkTimesheetApproval({
    timesheetIds,
    approvalStatus: 'APPROVED',
  });

  if (!result) {
    $q.notify({ type: 'negative', message: error.value ?? 'Batch approval failed.' });
    return;
  }

  $q.notify({
    type: 'positive',
    message: `Approved ${result.updatedCount ?? timesheetIds.length} clean timesheets.`,
  });
  await loadTimesheets(employeeSummaryPagination.value.page);
  await reloadEmployeeDetails();
}

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function openApprovalDialog(row: TimesheetRow, action: TimesheetApprovalAction) {
  approvalTarget.value = row;
  approvalAction.value = action;
  approvalRemarks.value = '';
  approvalDialogOpen.value = true;
}

function handleApprovalRequest(payload: { row: TimesheetRow; action: TimesheetApprovalAction }) {
  openApprovalDialog(payload.row, payload.action);
}

async function submitApproval() {
  if (!approvalTarget.value) {
    return;
  }

  const result = await attendanceStore.updateTimesheetApproval(approvalTarget.value.id, {
    approvalStatus: approvalAction.value,
    remarks: approvalRemarks.value.trim() || undefined,
  });

  if (!result) {
    $q.notify({ type: 'negative', message: error.value ?? 'Failed to update timesheet approval.' });
    return;
  }

  $q.notify({
    type: 'positive',
    message: `Timesheet ${approvalAction.value === 'APPROVED' ? 'approved' : 'rejected'}.`,
  });

  approvalDialogOpen.value = false;
  approvalTarget.value = null;
  approvalRemarks.value = '';
  await loadTimesheets(employeeSummaryPagination.value.page);
  await reloadEmployeeDetails();
}

watch(
  () => props.initialTab,
  async (nextTab) => {
    activeTab.value = nextTab;

    if (nextTab === 'logs') {
      await loadClockingLogs(1);
    }

    if (nextTab === 'timesheets') {
      await loadTimesheets(1);
    }
  },
);

onMounted(async () => {
  await attendanceStore.fetchPayPeriods();

  const today = localDateString(new Date());
  const defaultPeriod =
    payPeriods.value.find((period) => period.startDate <= today && period.endDate >= today) ??
    payPeriods.value[0];

  syncSelectedPayPeriod(defaultPeriod?.id ?? null);
  await Promise.all([
    refreshActiveTab(),
    activeTab.value === 'timesheets' ? Promise.resolve() : loadTimesheets(1),
  ]);
});
</script>

<style scoped>
.attendance-page {
  min-height: calc(100vh - 130px);
  max-width: 100%;
  border-radius: 16px;
  background: #f6f8fb;
}

</style>

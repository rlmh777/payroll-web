<template>
  <div class="scheduler-grid">
    <div ref="headerScrollRef" class="scheduler-grid-header-scroll">
      <div class="scheduler-grid-header" :style="gridStyle">
        <div class="scheduler-grid-sticky scheduler-grid-employee-header">
          <span>{{ viewBy === 'users' ? 'Employee' : 'Department' }}</span>
          <q-spinner
            v-if="loadingShifts && rows.length > 0"
            color="primary"
            size="14px"
            class="q-ml-sm"
          />
        </div>
        <div
          v-for="day in visibleDays"
          :key="day"
          class="scheduler-grid-day-header"
          :class="{ 'scheduler-grid-day-header--today': day === today }"
        >
          <div class="scheduler-grid-day-weekday">{{ formatSchedulerDayHeader(day).weekday }}</div>
          <div class="scheduler-grid-day-date">{{ formatSchedulerDayHeader(day).date }}</div>
        </div>
      </div>
    </div>

    <div
      ref="bodyScrollRef"
      class="scheduler-grid-scroll"
      @scroll="onBodyScroll"
    >
      <div class="scheduler-grid-table" :style="gridStyle">
        <template v-for="row in rows" :key="row.key">
          <div
            v-if="row.rowKind === 'department-header'"
            class="scheduler-department-header"
          >
            {{ row.label }}
          </div>

          <template v-else>
            <div
              class="scheduler-grid-sticky scheduler-grid-employee-cell"
              :style="row.employee ? { borderLeftColor: employeeColor(row.id).main } : undefined"
            >
              <div v-if="row.employee" class="scheduler-employee">
                <q-avatar
                  size="32px"
                  text-color="white"
                  :style="{ backgroundColor: employeeColor(row.id).main }"
                >
                  {{ employeeInitials(row.employee) }}
                </q-avatar>
                <div class="scheduler-employee-meta">
                  <div
                    class="scheduler-employee-name"
                    :style="{ color: employeeColor(row.id).text }"
                  >
                    {{ row.label }}
                  </div>
                  <div
                    v-if="rowStat(row)?.hourlyRate != null"
                    class="scheduler-employee-rate"
                  >
                    {{ formatSchedulerHourlyRate(rowStat(row)!.hourlyRate!) }}
                  </div>
                  <div class="scheduler-employee-hours">
                    {{ rowStat(row)?.hours ?? 0 }}h scheduled
                  </div>
                  <div
                    v-if="rowStat(row)?.overtimeHours != null && rowStat(row)!.overtimeHours! > 0"
                    class="scheduler-employee-overtime"
                  >
                    {{ rowStat(row)!.overtimeHours!.toFixed(2) }}h OT
                    <span v-if="rowStat(row)?.overtimeSource === 'timesheet'" class="text-grey-6">(timesheet)</span>
                  </div>
                  <div
                    v-if="rowStat(row)?.payout != null"
                    class="scheduler-employee-payout"
                  >
                    {{ formatSchedulerPayout(rowStat(row)!.payout!) }} est.
                  </div>
                </div>
              </div>
            </div>

            <div
              v-for="day in visibleDays"
              :key="`${row.key}-${day}`"
              class="scheduler-grid-cell"
              @click="emit('create-shift', { row, day })"
            >
              <div
                v-for="shift in cellShifts(row, day)"
                :key="shift.id"
                class="scheduler-shift"
                :style="shiftStyle(shift, row)"
                @click.stop="emit('select-shift', shift)"
              >
                <q-tooltip>{{ shiftTooltip(shift) }}</q-tooltip>
                <div class="scheduler-shift-time">{{ formatShiftTime(shift) }}</div>
                <div class="scheduler-shift-title">{{ shift.description }}</div>
                <div v-if="shift.department_name" class="scheduler-shift-meta">{{ shift.department_name }}</div>
                <div v-if="shift.employment_contract_label" class="scheduler-shift-meta">
                  {{ shift.employment_contract_label }}
                </div>
              </div>
            </div>
          </template>
        </template>

        <div v-if="loading" class="scheduler-grid-empty">
          <div class="text-grey-7">Loading schedule…</div>
        </div>

        <div v-else-if="!rows.length && emptyMessage" class="scheduler-grid-empty">
          <div class="text-grey-7">{{ emptyMessage }}</div>
        </div>
      </div>

      <div
        v-if="loadingMore"
        class="scheduler-grid-load-more row justify-center q-py-md"
      >
        <q-spinner-dots color="primary" size="32px" />
      </div>

      <div
        v-else-if="!hasMore && rows.length > 0 && !loading"
        class="scheduler-grid-end-label text-caption text-grey-6"
      >
        All employees loaded
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CalendarEntry, CalendarEmployee } from '@hr/stores/calendar-store';
import {
  employeeInitials,
  eventsForCell,
  effectiveHourlyRateForEmployee,
  expectedPayoutForRow,
  formatSchedulerDayHeader,
  formatSchedulerHourlyRate,
  formatSchedulerPayout,
  formatShiftTime,
  schedulerEmployeeColor,
  shiftHoursForRow,
  todayDateString,
  type SchedulerGridRow,
  type SchedulerViewBy,
} from '@hr/utils/scheduler-utils';
import {
  aggregateTimesheetOvertime,
  estimateScheduledOvertimeForRow,
} from '@payroll/utils/overtime-estimate-utils';
import { getActiveEmploymentCompensation, getActiveEmploymentDetail } from '@hr/utils/calendar-employment-utils';
import type { TimesheetRow } from '@payroll/stores/attendance-store';
import type { Department } from '@hr/stores/department-store';

const LOAD_MORE_OFFSET_PX = 240;

const props = defineProps<{
  rows: SchedulerGridRow[];
  visibleDays: string[];
  events: CalendarEntry[];
  employeesById?: Record<string, CalendarEmployee>;
  viewBy: SchedulerViewBy;
  loading?: boolean;
  loadingShifts?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  emptyMessage?: string;
  loadMore?: () => Promise<void>;
  timesheetsByEmployeeId?: Record<string, TimesheetRow[]>;
  departmentsById?: Record<number, Department>;
}>();

const emit = defineEmits<{
  (event: 'select-shift', shift: CalendarEntry): void;
  (event: 'create-shift', payload: { row: SchedulerGridRow; day: string }): void;
}>();

const today = todayDateString();
const headerScrollRef = ref<HTMLElement | null>(null);
const bodyScrollRef = ref<HTMLElement | null>(null);
const isLoadingMore = ref(false);

const gridStyle = computed(() => ({
  gridTemplateColumns: `220px repeat(${props.visibleDays.length}, minmax(120px, 1fr))`,
}));

const rowStatsByKey = computed(() => {
  const stats = new Map<string, {
    hours: number;
    payout: number | null;
    hourlyRate: number | null;
    overtimeHours: number | null;
    overtimeSource: 'timesheet' | 'estimate' | null;
  }>();

  for (const row of props.rows) {
    if (row.rowKind === 'department-header') {
      continue;
    }

    const employee = props.employeesById?.[row.id] ?? row.employee ?? null;
    const compensation = employee ? getActiveEmploymentCompensation(employee) : null;
    const employmentDetail = employee ? getActiveEmploymentDetail(employee) : null;
    const departmentId = employmentDetail?.departmentId ?? null;
    const department = departmentId != null ? props.departmentsById?.[departmentId] : undefined;
    const timesheetRows = props.timesheetsByEmployeeId?.[row.id] ?? [];
    const timesheetOt = timesheetRows.length > 0 ? aggregateTimesheetOvertime(timesheetRows) : null;
    const scheduledEstimate = estimateScheduledOvertimeForRow(
      props.events,
      row,
      props.visibleDays,
      compensation?.compensationMethod,
      department,
    );

    stats.set(row.key, {
      hours: shiftHoursForRow(props.events, row, props.visibleDays),
      payout: expectedPayoutForRow(props.events, row, props.visibleDays, employee, department),
      hourlyRate: effectiveHourlyRateForEmployee(employee),
      overtimeHours: timesheetOt?.overtimeHours ?? scheduledEstimate?.overtimeHours ?? null,
      overtimeSource: timesheetOt && timesheetOt.overtimeHours > 0
        ? 'timesheet'
        : scheduledEstimate && scheduledEstimate.overtimeHours > 0
          ? 'estimate'
          : null,
    });
  }

  return stats;
});

function rowStat(row: SchedulerGridRow) {
  return rowStatsByKey.value.get(row.key);
}

function syncHeaderScroll() {
  if (headerScrollRef.value && bodyScrollRef.value) {
    headerScrollRef.value.scrollLeft = bodyScrollRef.value.scrollLeft;
  }
}

async function triggerLoadMore() {
  if (
    isLoadingMore.value ||
    props.loading ||
    props.loadingMore ||
    !props.hasMore ||
    !props.loadMore ||
    props.rows.length === 0
  ) {
    return;
  }

  isLoadingMore.value = true;

  try {
    await props.loadMore();
  } finally {
    isLoadingMore.value = false;
  }
}

function onBodyScroll() {
  syncHeaderScroll();

  const element = bodyScrollRef.value;
  if (!element) {
    return;
  }

  const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
  if (remaining <= LOAD_MORE_OFFSET_PX) {
    void triggerLoadMore();
  }
}

function cellShifts(row: SchedulerGridRow, day: string) {
  return eventsForCell(props.events, row, day);
}

function employeeColor(employeeId: string) {
  return schedulerEmployeeColor(employeeId);
}

function shiftStyle(shift: CalendarEntry, row: SchedulerGridRow) {
  const colors = schedulerEmployeeColor(shift.employee_id ?? row.id);

  return {
    '--shift-text': colors.text,
    borderLeftColor: colors.main,
    backgroundColor: colors.light,
    borderColor: `${colors.main}40`,
  };
}

function shiftTooltip(shift: CalendarEntry) {
  const lines = [shift.description, formatShiftTime(shift)];
  if (shift.employee_name) lines.push(shift.employee_name);
  if (shift.department_name) lines.push(shift.department_name);
  if (shift.worksite_name) lines.push(shift.worksite_name);
  if (shift.include_lunch_hour) {
    const hours = shift.lunch_hour_hours ?? 1;
    lines.push(`Lunch: ${hours}h deducted`);
  }
  return lines.join('\n');
}
</script>

<style scoped>
.scheduler-grid {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 0;
  height: 100%;
  border: none;
  border-radius: 0;
  overflow: hidden;
  background: #fafafa;
}

.scheduler-grid-header-scroll {
  flex-shrink: 0;
  overflow: hidden;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: #f5f5f5;
}

.scheduler-grid-header {
  display: grid;
  min-width: max-content;
}

.scheduler-grid-scroll {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
}

.scheduler-grid-table {
  display: grid;
  min-width: max-content;
}

.scheduler-grid-sticky {
  position: sticky;
  left: 0;
  z-index: 2;
  background: #fff;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.scheduler-grid-employee-header,
.scheduler-grid-day-header {
  padding: 12px;
  font-weight: 600;
  background: #f5f5f5;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.scheduler-grid-employee-header {
  display: flex;
  align-items: center;
}

.scheduler-grid-day-header {
  text-align: center;
  border-left: 1px solid rgba(0, 0, 0, 0.06);
}

.scheduler-grid-day-header--today {
  background: #e3f2fd;
  color: #1565c0;
}

.scheduler-grid-day-weekday {
  font-size: 11px;
  letter-spacing: 0.04em;
}

.scheduler-grid-day-date {
  font-size: 18px;
  line-height: 1.2;
}

.scheduler-department-header {
  grid-column: 1 / -1;
  padding: 10px 14px;
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #455a64;
  background: #eceff1;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.scheduler-grid-employee-cell {
  padding: 10px 12px;
  min-height: 72px;
  display: flex;
  align-items: center;
  border-left: 3px solid transparent;
}

.scheduler-employee {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.scheduler-employee-meta {
  min-width: 0;
}

.scheduler-employee-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scheduler-employee-rate {
  font-size: 12px;
  color: #546e7a;
  font-weight: 500;
}

.scheduler-employee-hours {
  font-size: 12px;
  color: #666;
}

.scheduler-employee-overtime {
  font-size: 11px;
  color: #e65100;
  font-weight: 600;
}

.scheduler-employee-payout {
  font-size: 12px;
  font-weight: 600;
  color: #2e7d32;
  margin-top: 2px;
}

.scheduler-grid-cell {
  min-height: 72px;
  padding: 6px;
  border-left: 1px solid rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  cursor: pointer;
}

.scheduler-grid-cell:hover {
  background: #f8fbff;
}

.scheduler-shift {
  border-radius: 8px;
  border: 1px solid rgba(25, 118, 210, 0.2);
  border-left-width: 4px;
  padding: 6px 8px;
  margin-bottom: 4px;
}

.scheduler-shift-time {
  font-size: 11px;
  font-weight: 700;
  color: var(--shift-text, #1565c0);
}

.scheduler-shift-title {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--shift-text, #1d1d1d);
}

.scheduler-shift-meta {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}

.scheduler-grid-empty {
  grid-column: 1 / -1;
  padding: 48px 16px;
  text-align: center;
}

.scheduler-grid-load-more {
  min-width: max-content;
  width: 100%;
}

.scheduler-grid-end-label {
  text-align: center;
  padding: 8px 16px 16px;
}
</style>

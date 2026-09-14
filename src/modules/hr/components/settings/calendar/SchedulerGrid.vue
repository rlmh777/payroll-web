<template>
  <div
    class="scheduler-grid"
    :class="{ 'scheduler-grid--selecting': Boolean(dayDrag) }"
  >
    <div
      ref="headerScrollRef"
      class="scheduler-grid-header-scroll"
      :style="headerScrollStyle"
    >
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
          :class="{
            'scheduler-grid-day-header--today': day === today,
            'scheduler-grid-day-header--holiday': isHoliday(day),
          }"
        >
          <div class="scheduler-grid-day-weekday">{{ formatSchedulerDayHeader(day).weekday }}</div>
          <div class="scheduler-grid-day-date">{{ formatSchedulerDayHeader(day).date }}</div>
          <div
            v-if="holidayName(day)"
            class="scheduler-grid-day-holiday-name"
          >
            {{ holidayName(day) }}
            <q-tooltip>{{ holidayName(day) }}</q-tooltip>
          </div>
          <div
            v-for="notice in headerNoticesForDay(day)"
            :key="`header-notice-${day}-${notice.id}`"
            class="scheduler-grid-day-notice"
            :class="{ 'scheduler-grid-day-notice--editable': canEditNotices }"
            @click.stop="onNoticeClick(notice)"
          >
            {{ notice.title }}
            <q-tooltip>
              {{ noticeTooltip(notice) }}
            </q-tooltip>
          </div>
        </div>

        <template v-if="showMetricsRow">
          <div class="scheduler-grid-sticky scheduler-grid-metrics-label">
            Daily metrics
            <q-tooltip v-if="canEditMetrics">Double-click a day to edit</q-tooltip>
          </div>
          <div
            v-for="day in visibleDays"
            :key="`metric-${day}`"
            class="scheduler-grid-day-metric"
            :class="{
              'scheduler-grid-day-metric--today': day === today,
              'scheduler-grid-day-metric--holiday': isHoliday(day),
              'scheduler-grid-day-metric--editable': canEditMetrics,
            }"
            @dblclick="onMetricDoubleClick(day)"
          >
            <div
              v-for="definition in (metricDefinitions ?? [])"
              :key="`${day}-${definition.id}`"
              class="scheduler-grid-day-metric-line"
            >
              <span class="scheduler-grid-day-metric-name">{{ metricLabel(definition) }}</span>
              <span class="scheduler-grid-day-metric-value">{{ metricDisplay(day, definition) }}</span>
            </div>
          </div>
        </template>
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
            v-if="row.rowKind === 'department-header' || row.rowKind === 'group-header'"
            class="scheduler-department-header"
          >
            {{ row.label }}
          </div>

          <template v-else>
            <div
              class="scheduler-grid-sticky scheduler-grid-employee-cell"
              :class="{ 'scheduler-grid-employee-cell--notice': rowHasNotices(row) }"
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
                    v-if="employeeDepartmentName(row)"
                    class="scheduler-employee-department"
                  >
                    {{ employeeDepartmentName(row) }}
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
                  <div class="scheduler-employee-accrued">
                    {{ formatAccruedHours(row.id) }} accrued
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
                  <div
                    v-if="noticesForEmployeeRow(row).length"
                    class="scheduler-employee-notices"
                  >
                    <div
                      v-for="notice in noticesForEmployeeRow(row)"
                      :key="`row-notice-${row.key}-${notice.id}`"
                      class="scheduler-employee-notice-card"
                      :class="{ 'scheduler-employee-notice-card--editable': canEditNotices }"
                      @click.stop="onNoticeClick(notice)"
                    >
                      <div class="scheduler-employee-notice-title">{{ notice.title }}</div>
                      <div class="scheduler-employee-notice-meta">
                        {{ noticeAudienceLabel(notice) }}
                      </div>
                      <q-tooltip>{{ noticeTooltip(notice) }}</q-tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-for="day in visibleDays"
              :key="`${row.key}-${day}`"
              class="scheduler-grid-cell"
              :class="{
                'scheduler-grid-cell--holiday': isHoliday(day),
                'scheduler-grid-cell--leave': cellLeaves(row, day).length > 0,
                'scheduler-grid-cell--notice': noticesForEmployeeCell(row, day).length > 0,
                'scheduler-grid-cell--interactive': canScheduleShifts,
                'scheduler-grid-cell--selected': isCellSelected(row, day),
                'scheduler-grid-cell--past': day < today,
              }"
              @pointerdown="onCellPointerDown($event, row, day)"
              @pointerenter="onCellPointerEnter(row, day)"
            >
              <div
                v-for="notice in noticesForEmployeeCell(row, day)"
                :key="`cell-notice-${row.key}-${day}-${notice.id}`"
                class="scheduler-notice-chip"
                :class="{ 'scheduler-notice-chip--editable': canEditNotices }"
                @pointerdown.stop
                @click.stop="onNoticeClick(notice)"
              >
                {{ notice.title }}
                <q-tooltip>{{ noticeTooltip(notice) }}</q-tooltip>
              </div>
              <div
                v-for="leave in cellLeaves(row, day)"
                :key="leave.id"
                class="scheduler-leave-chip"
                @pointerdown.stop
                @click.stop="emit('select-shift', leave)"
              >
                <div class="scheduler-leave-chip-label">
                  {{ leave.leave_type_name || leave.description || 'Leave' }}
                </div>
                <div
                  v-if="leave.start_time || leave.end_time"
                  class="scheduler-leave-chip-time"
                >
                  {{ formatShiftTime(leave) }}
                </div>
                <q-tooltip>{{ leaveTooltip(leave) }}</q-tooltip>
              </div>
              <div
                v-for="shift in cellShifts(row, day)"
                :key="shift.id"
                class="scheduler-shift"
                :class="{ 'scheduler-shift--preview': shift.is_import_preview }"
                :style="shiftStyle(shift, row)"
                @pointerdown.stop
                @click.stop="onShiftClick(shift)"
              >
                <q-tooltip>{{ shiftTooltip(shift) }}</q-tooltip>
                <div class="scheduler-shift-time">
                  {{ formatShiftTime(shift) }}
                  <span v-if="shift.is_import_preview" class="scheduler-shift-preview-tag">Preview</span>
                </div>
                <div v-if="shift.description?.trim()" class="scheduler-shift-title">{{ shift.description }}</div>
                <div v-if="shift.department_name" class="scheduler-shift-meta">{{ shift.department_name }}</div>
                <div v-if="shift.employment_contract_label" class="scheduler-shift-meta">
                  {{ shift.employment_contract_label }}
                </div>
              </div>
            </div>
          </template>
        </template>

        <q-menu
          ref="cellMenuRef"
          touch-position
          no-parent-event
          @before-show="onCellMenuBeforeShow"
          @hide="onCellMenuHide"
        >
          <div class="scheduler-shift-menu" @click.stop>
            <div class="scheduler-shift-menu__header text-subtitle2">
              Schedule {{ menuDayLabel }}
            </div>

            <q-input
              v-model="menuSearch"
              dense
              outlined
              clearable
              debounce="150"
              placeholder="Search all shifts…"
              class="scheduler-shift-menu__search"
              :disable="shiftTemplateStore.isLoading && !shiftTemplateStore.templates.length"
              @click.stop
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>

            <div
              v-if="shiftTemplateStore.isLoading && !shiftTemplateStore.templates.length"
              class="scheduler-shift-menu__loading column items-center q-py-md"
            >
              <q-spinner color="primary" size="28px" />
              <div class="text-caption text-grey-7 q-mt-sm">Loading shifts…</div>
            </div>

            <q-list
              v-else
              dense
              class="scheduler-shift-menu__list scroll"
            >
              <template v-if="menuSuggestedTemplates.length">
                <q-item-label header class="scheduler-shift-menu__section">
                  {{ menuSearch.trim() ? 'Matches' : 'Suggested for employee dept' }}
                </q-item-label>
                <q-item
                  v-for="template in menuSuggestedTemplates"
                  :key="`suggested-${template.id}`"
                  v-close-popup
                  clickable
                  @click="emitAssignTemplate(template)"
                >
                  <q-item-section>
                    <q-item-label>{{ shiftTemplateDisplayLabel(template) }}</q-item-label>
                    <q-item-label caption>
                      {{ formatTemplateSegments(template) }}
                      <span v-if="template.departments.length">
                        · {{ template.departments.map((department) => department.name).join(', ') }}
                      </span>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>

              <template v-if="menuOtherTemplates.length">
                <q-item-label header class="scheduler-shift-menu__section">
                  {{ menuSearch.trim() ? 'Other matches' : 'Other shifts' }}
                </q-item-label>
                <q-item
                  v-for="template in menuOtherTemplates"
                  :key="`other-${template.id}`"
                  v-close-popup
                  clickable
                  @click="emitAssignTemplate(template)"
                >
                  <q-item-section>
                    <q-item-label>{{ shiftTemplateDisplayLabel(template) }}</q-item-label>
                    <q-item-label caption>
                      {{ formatTemplateSegments(template) }}
                      <span v-if="template.departments.length">
                        · {{ template.departments.map((department) => department.name).join(', ') }}
                      </span>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>

              <q-item
                v-if="!menuSuggestedTemplates.length && !menuOtherTemplates.length"
                clickable
                disable
              >
                <q-item-section>
                  {{
                    shiftTemplateStore.error
                      ? shiftTemplateStore.error
                      : menuSearch.trim()
                        ? 'No shifts match that search'
                        : 'No shift templates available'
                  }}
                </q-item-section>
              </q-item>

              <q-separator spaced />

              <q-item v-close-popup clickable @click="emitCreateCustom">
                <q-item-section avatar>
                  <q-icon name="edit_calendar" />
                </q-item-section>
                <q-item-section>Custom shift…</q-item-section>
              </q-item>

              <q-item v-close-popup clickable @click="emit('create-shift-template')">
                <q-item-section avatar>
                  <q-icon name="add" />
                </q-item-section>
                <q-item-section>New shift template…</q-item-section>
              </q-item>

              <q-item v-close-popup clickable @click="emit('manage-shift-templates')">
                <q-item-section avatar>
                  <q-icon name="tune" />
                </q-item-section>
                <q-item-section>Manage shift templates…</q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-menu>

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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { QMenu } from 'quasar';
import type { CalendarEntry, CalendarEmployee } from '@hr/stores/calendar-store';
import {
  employeeInitials,
  eventsForCell,
  leavesForCell,
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
import type { SchedulerMetricDefinition } from '@hr/stores/scheduler-metric-store';
import type { SchedulerNotice } from '@hr/stores/scheduler-notice-store';
import {
  shiftTemplateDisplayLabel,
  shiftTemplateSearchText,
  useShiftTemplateStore,
  type ShiftTemplate,
} from '@hr/stores/shift-template-store';
import { clipDateRangeToFuture, normalizeDateRange } from '@hr/utils/calendar-event-utils';

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
  accruedHoursByEmployeeId?: Record<string, number>;
  metricDefinitions?: SchedulerMetricDefinition[];
  metricValuesByDate?: Record<string, Record<string, number | null>>;
  canEditMetrics?: boolean;
  holidayNamesByDate?: Record<string, string>;
  notices?: SchedulerNotice[];
  canEditNotices?: boolean;
  canScheduleShifts?: boolean;
}>();

const emit = defineEmits<{
  (event: 'select-shift', shift: CalendarEntry): void;
  (event: 'create-shift', payload: { row: SchedulerGridRow; day: string; endDay: string }): void;
  (event: 'assign-shift-template', payload: {
    row: SchedulerGridRow;
    day: string;
    endDay: string;
    template: ShiftTemplate;
  }): void;
  (event: 'create-shift-template'): void;
  (event: 'manage-shift-templates'): void;
  (event: 'edit-day-metrics', day: string): void;
  (event: 'edit-notice', notice: SchedulerNotice): void;
}>();

const shiftTemplateStore = useShiftTemplateStore();
const cellMenuRef = ref<QMenu | null>(null);
const menuContext = ref<{ row: SchedulerGridRow; day: string; endDay: string } | null>(null);
const menuSearch = ref('');
const dayDrag = ref<{
  row: SchedulerGridRow;
  anchorDay: string;
  focusDay: string;
} | null>(null);

const canScheduleShifts = computed(() => Boolean(props.canScheduleShifts));

const selectionRange = computed(() => {
  if (dayDrag.value) {
    return normalizeDateRange(dayDrag.value.anchorDay, dayDrag.value.focusDay);
  }
  if (menuContext.value) {
    return normalizeDateRange(menuContext.value.day, menuContext.value.endDay);
  }
  return null;
});

const menuDayLabel = computed(() => {
  const range = selectionRange.value;
  if (!range) {
    return '';
  }
  const start = formatSchedulerDayHeader(range.start);
  if (range.start === range.end) {
    return `${start.weekday} ${start.date}`;
  }
  const end = formatSchedulerDayHeader(range.end);
  return `${start.weekday} ${start.date} – ${end.weekday} ${end.date}`;
});

const menuEmployeeDepartmentId = computed(() => {
  if (!menuContext.value || menuContext.value.row.rowKind !== 'employee') {
    return null;
  }
  const employee = props.employeesById?.[menuContext.value.row.id];
  return getActiveEmploymentDetail(employee)?.departmentId ?? null;
});

const menuFilteredTemplates = computed(() => {
  const query = menuSearch.value.trim().toLowerCase();
  const templates = shiftTemplateStore.activeTemplates;
  if (!query) {
    return templates;
  }

  return templates.filter((template) => shiftTemplateSearchText(template).includes(query));
});

const menuSuggestedTemplates = computed(() => {
  const departmentId = menuEmployeeDepartmentId.value;
  const filtered = menuFilteredTemplates.value;

  if (departmentId == null) {
    return filtered;
  }

  return filtered.filter((template) =>
    !template.department_ids.length || template.department_ids.includes(departmentId),
  );
});

const menuOtherTemplates = computed(() => {
  const suggestedIds = new Set(menuSuggestedTemplates.value.map((template) => template.id));
  return menuFilteredTemplates.value.filter((template) => !suggestedIds.has(template.id));
});

function onCellMenuBeforeShow() {
  menuSearch.value = '';
  void shiftTemplateStore.ensureTemplatesLoaded({
    force: Boolean(shiftTemplateStore.error) || shiftTemplateStore.templates.length === 0,
  });
}

function onCellMenuHide() {
  menuSearch.value = '';
  menuContext.value = null;
  dayDrag.value = null;
}

function isCellSelected(row: SchedulerGridRow, day: string): boolean {
  const range = selectionRange.value;
  if (!range) {
    return false;
  }

  const activeRow = dayDrag.value?.row ?? menuContext.value?.row;
  if (!activeRow || activeRow.key !== row.key) {
    return false;
  }

  return day >= range.start && day <= range.end;
}

const showMetricsRow = computed(
  () => (props.metricDefinitions?.length ?? 0) > 0,
);

const today = todayDateString();
const headerScrollRef = ref<HTMLElement | null>(null);
const bodyScrollRef = ref<HTMLElement | null>(null);
const isLoadingMore = ref(false);
const bodyScrollbarWidth = ref(0);

let bodyResizeObserver: ResizeObserver | null = null;

const EMPLOYEE_COLUMN_WIDTH_PX = 220;
const DAY_COLUMN_MIN_WIDTH_PX = 120;

const gridStyle = computed(() => ({
  // Fixed day tracks (not 1fr) so header/body columns stay the same width
  // even when the body shows a vertical scrollbar.
  gridTemplateColumns: `${EMPLOYEE_COLUMN_WIDTH_PX}px repeat(${props.visibleDays.length}, minmax(${DAY_COLUMN_MIN_WIDTH_PX}px, ${DAY_COLUMN_MIN_WIDTH_PX}px))`,
}));

const headerScrollStyle = computed(() => ({
  paddingRight: `${bodyScrollbarWidth.value}px`,
}));

function updateBodyScrollbarWidth() {
  const element = bodyScrollRef.value;
  if (!element) {
    bodyScrollbarWidth.value = 0;
    return;
  }

  bodyScrollbarWidth.value = Math.max(0, element.offsetWidth - element.clientWidth);
}

const rowStatsByKey = computed(() => {
  const stats = new Map<string, {
    hours: number;
    payout: number | null;
    hourlyRate: number | null;
    overtimeHours: number | null;
    overtimeSource: 'timesheet' | 'estimate' | null;
  }>();

  for (const row of props.rows) {
    if (row.rowKind === 'department-header' || row.rowKind === 'group-header') {
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

function formatAccruedHours(employeeId: string): string {
  const hours = Number(props.accruedHoursByEmployeeId?.[employeeId] ?? 0);
  return `${hours.toFixed(hours % 1 === 0 ? 0 : 2)}h`;
}

function employeeDepartmentName(row: SchedulerGridRow): string | null {
  if (row.rowKind !== 'employee') {
    return null;
  }

  const fromEmployment = getActiveEmploymentDetail(row.employee)?.departmentId ?? null;
  const departmentId = fromEmployment ?? row.departmentId ?? null;
  if (departmentId == null) {
    return null;
  }

  return props.departmentsById?.[departmentId]?.name?.trim() || null;
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

async function fillViewportIfNeeded() {
  await nextTick();
  const element = bodyScrollRef.value;
  if (
    !element ||
    isLoadingMore.value ||
    props.loading ||
    props.loadingMore ||
    !props.hasMore ||
    props.rows.length === 0
  ) {
    return;
  }

  if (element.scrollHeight <= element.clientHeight + LOAD_MORE_OFFSET_PX) {
    await triggerLoadMore();
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

watch(
  () => [props.rows.length, props.hasMore, props.loading, props.loadingMore] as const,
  () => {
    void fillViewportIfNeeded();
    void nextTick(() => updateBodyScrollbarWidth());
  },
);

watch(
  () => props.visibleDays.length,
  () => {
    void nextTick(() => updateBodyScrollbarWidth());
  },
);

onMounted(() => {
  updateBodyScrollbarWidth();

  if (typeof ResizeObserver !== 'undefined' && bodyScrollRef.value) {
    bodyResizeObserver = new ResizeObserver(() => {
      updateBodyScrollbarWidth();
    });
    bodyResizeObserver.observe(bodyScrollRef.value);
  }
});

onBeforeUnmount(() => {
  clearDayDragListeners();
  bodyResizeObserver?.disconnect();
  bodyResizeObserver = null;
});

function cellShifts(row: SchedulerGridRow, day: string) {
  return eventsForCell(props.events, row, day);
}

function cellLeaves(row: SchedulerGridRow, day: string) {
  return leavesForCell(props.events, row, day);
}

function leaveTooltip(leave: CalendarEntry) {
  const lines = [
    leave.leave_type_name || leave.description || 'Leave',
    leave.start_date && leave.end_date && leave.start_date !== leave.end_date
      ? `${leave.start_date} → ${leave.end_date}`
      : leave.date,
    formatShiftTime(leave) || null,
    leave.approval_status ? `Status: ${leave.approval_status}` : null,
    leave.notes?.trim() || null,
  ].filter(Boolean) as string[];

  return lines.join('\n');
}

function onShiftClick(shift: CalendarEntry) {
  if (shift.is_import_preview) {
    return;
  }

  emit('select-shift', shift);
}

function clearDayDragListeners() {
  window.removeEventListener('pointerup', onCellPointerUp);
  window.removeEventListener('pointercancel', onCellPointerUp);
}

function onCellPointerDown(event: PointerEvent, row: SchedulerGridRow, day: string) {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) {
    return;
  }
  if (!canScheduleShifts.value || row.rowKind !== 'employee') {
    return;
  }
  if (day < today) {
    return;
  }

  event.preventDefault();
  dayDrag.value = {
    row,
    anchorDay: day,
    focusDay: day,
  };
  window.addEventListener('pointerup', onCellPointerUp);
  window.addEventListener('pointercancel', onCellPointerUp);
}

function onCellPointerEnter(row: SchedulerGridRow, day: string) {
  if (!dayDrag.value || dayDrag.value.row.key !== row.key) {
    return;
  }
  if (day < today) {
    return;
  }
  dayDrag.value = {
    ...dayDrag.value,
    focusDay: day,
  };
}

function onCellPointerUp(event: PointerEvent) {
  clearDayDragListeners();
  const drag = dayDrag.value;
  if (!drag) {
    return;
  }

  const clipped = clipDateRangeToFuture(drag.anchorDay, drag.focusDay);
  dayDrag.value = null;

  if (!clipped) {
    return;
  }

  menuContext.value = {
    row: drag.row,
    day: clipped.start,
    endDay: clipped.end,
  };

  // Prefetch so the searchable list is ready as soon as the menu opens.
  void shiftTemplateStore.ensureTemplatesLoaded();
  cellMenuRef.value?.show(event);
}

function formatTemplateSegments(template: ShiftTemplate): string {
  return template.segments
    .map((segment) => `${segment.start_time}–${segment.end_time}`)
    .join(' / ');
}

function emitAssignTemplate(template: ShiftTemplate) {
  if (!menuContext.value) {
    return;
  }
  emit('assign-shift-template', {
    row: menuContext.value.row,
    day: menuContext.value.day,
    endDay: menuContext.value.endDay,
    template,
  });
}

function emitCreateCustom() {
  if (!menuContext.value) {
    return;
  }
  emit('create-shift', {
    row: menuContext.value.row,
    day: menuContext.value.day,
    endDay: menuContext.value.endDay,
  });
}

function employeeColor(employeeId: string) {
  return schedulerEmployeeColor(employeeId);
}

function shiftStyle(shift: CalendarEntry, row: SchedulerGridRow) {
  const colors = schedulerEmployeeColor(shift.employee_id ?? row.id);

  if (shift.is_import_preview) {
    return {
      '--shift-text': colors.text,
      borderLeftColor: colors.main,
      backgroundColor: `${colors.light}99`,
      borderColor: colors.main,
      borderStyle: 'dashed',
    };
  }

  return {
    '--shift-text': colors.text,
    borderLeftColor: colors.main,
    backgroundColor: colors.light,
    borderColor: `${colors.main}40`,
  };
}

function shiftTooltip(shift: CalendarEntry) {
  const lines = [
    shift.is_import_preview ? 'Import preview (not saved yet)' : null,
    shift.description?.trim(),
    formatShiftTime(shift),
    shift.employee_name,
    shift.department_name,
    shift.worksite_name,
  ].filter(Boolean) as string[];
  if (shift.include_lunch_hour) {
    const hours = shift.lunch_hour_hours ?? 1;
    lines.push(`Lunch: ${hours}h deducted`);
  }
  return lines.join('\n');
}

function metricLabel(definition: SchedulerMetricDefinition): string {
  return definition.short_label?.trim() || definition.name;
}

function metricDisplay(day: string, definition: SchedulerMetricDefinition): string {
  const value = props.metricValuesByDate?.[day]?.[String(definition.id)];
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }

  if (definition.value_type === 'integer') {
    return String(Math.round(Number(value)));
  }

  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function onMetricDoubleClick(day: string) {
  if (!props.canEditMetrics) {
    return;
  }
  emit('edit-day-metrics', day);
}

function isHoliday(day: string): boolean {
  return Boolean(props.holidayNamesByDate?.[day]);
}

function holidayName(day: string): string | null {
  return props.holidayNamesByDate?.[day] ?? null;
}

function noticeOverlapsDay(notice: SchedulerNotice, day: string): boolean {
  return notice.start_date <= day && notice.end_date >= day;
}

function noticeOverlapsVisibleDays(notice: SchedulerNotice): boolean {
  return props.visibleDays.some((day) => noticeOverlapsDay(notice, day));
}

function employeeDepartmentId(row: SchedulerGridRow): number | null {
  const employee = props.employeesById?.[row.id] ?? row.employee ?? null;
  if (!employee) {
    return null;
  }
  return getActiveEmploymentDetail(employee)?.departmentId ?? null;
}

function noticeAppliesToEmployee(notice: SchedulerNotice, row: SchedulerGridRow): boolean {
  if (row.rowKind !== 'employee') {
    return false;
  }

  if (notice.audience_type === 'company') {
    return true;
  }

  if (notice.audience_type === 'employees') {
    return notice.employee_ids.includes(row.id);
  }

  if (notice.audience_type === 'departments') {
    const departmentId = employeeDepartmentId(row);
    return departmentId != null && notice.department_ids.includes(departmentId);
  }

  return false;
}

function headerNoticesForDay(day: string): SchedulerNotice[] {
  return (props.notices ?? []).filter((notice) => {
    if (!noticeOverlapsDay(notice, day)) {
      return false;
    }
    // Company / department events belong on the day header (not the employee name card).
    return notice.audience_type === 'company' || notice.audience_type === 'departments';
  });
}

/** Employee-name card: only employee-targeted notices for the visible period. */
function noticesForEmployeeRow(row: SchedulerGridRow): SchedulerNotice[] {
  if (row.rowKind !== 'employee') {
    return [];
  }

  return (props.notices ?? []).filter((notice) => {
    if (notice.audience_type !== 'employees') {
      return false;
    }
    if (!noticeOverlapsVisibleDays(notice)) {
      return false;
    }
    return noticeAppliesToEmployee(notice, row);
  });
}

function rowHasNotices(row: SchedulerGridRow): boolean {
  return noticesForEmployeeRow(row).length > 0;
}

/** Day × employee cells: company, matching department, and employee-targeted notices. */
function noticesForEmployeeCell(row: SchedulerGridRow, day: string): SchedulerNotice[] {
  if (row.rowKind !== 'employee') {
    return [];
  }

  return (props.notices ?? []).filter((notice) => {
    if (!noticeOverlapsDay(notice, day)) {
      return false;
    }
    return noticeAppliesToEmployee(notice, row);
  });
}

function noticeAudienceLabel(notice: SchedulerNotice): string {
  if (notice.audience_type === 'company') {
    return 'Company';
  }
  if (notice.audience_type === 'departments') {
    const names = notice.departments.map((department) => department.name).filter(Boolean);
    return names.length ? names.join(', ') : 'Departments';
  }
  return 'Assigned';
}

function noticeTooltip(notice: SchedulerNotice): string {
  const lines = [notice.title];
  if (notice.description?.trim()) {
    lines.push(notice.description.trim());
  }

  if (notice.audience_type === 'company') {
    lines.push('Audience: Entire company');
  } else if (notice.audience_type === 'departments') {
    const names = notice.departments.map((department) => department.name).join(', ');
    lines.push(`Audience: ${names || 'Departments'}`);
  } else {
    const names = notice.employees.map((employee) => employee.display_name).join(', ');
    lines.push(`Audience: ${names || 'Employees'}`);
  }

  if (notice.start_date === notice.end_date) {
    lines.push(notice.start_date);
  } else {
    lines.push(`${notice.start_date} – ${notice.end_date}`);
  }

  return lines.join('\n');
}

function onNoticeClick(notice: SchedulerNotice) {
  if (!props.canEditNotices) {
    return;
  }
  emit('edit-notice', notice);
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
  box-sizing: border-box;
}

.scheduler-grid-header {
  display: grid;
  min-width: max-content;
  box-sizing: border-box;
}

.scheduler-grid-scroll {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
}

.scheduler-grid-table {
  display: grid;
  min-width: max-content;
  box-sizing: border-box;
}

.scheduler-grid-sticky {
  position: sticky;
  left: 0;
  z-index: 2;
  background: #fff;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

.scheduler-grid-employee-header,
.scheduler-grid-day-header {
  padding: 12px;
  font-weight: 600;
  background: #f5f5f5;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

.scheduler-grid-employee-header {
  display: flex;
  align-items: center;
  border-left: 3px solid transparent;
}

.scheduler-grid-day-header {
  text-align: center;
  border-left: 1px solid rgba(0, 0, 0, 0.06);
}

.scheduler-grid-day-header--today {
  background: #e3f2fd;
  color: #1565c0;
}

.scheduler-grid-day-header--holiday:not(.scheduler-grid-day-header--today) {
  background: #f3e5f5;
  color: #6a1b9a;
}

.scheduler-grid-day-weekday {
  font-size: 11px;
  letter-spacing: 0.04em;
}

.scheduler-grid-day-date {
  font-size: 18px;
  line-height: 1.2;
}

.scheduler-grid-day-holiday-name {
  margin-top: 2px;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.01em;
  color: #6a1b9a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scheduler-grid-day-header--today .scheduler-grid-day-holiday-name {
  color: #1565c0;
}

.scheduler-grid-day-notice {
  margin-top: 3px;
  padding: 2px 4px;
  border-radius: 4px;
  background: #fff3e0;
  color: #e65100;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scheduler-grid-day-notice--editable {
  cursor: pointer;
}

.scheduler-grid-day-notice--editable:hover {
  background: #ffe0b2;
}

.scheduler-notice-chip {
  margin-bottom: 4px;
  padding: 3px 6px;
  border-radius: 6px;
  background: #fff3e0;
  border: 1px solid #ffcc80;
  color: #e65100;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scheduler-notice-chip--editable {
  cursor: pointer;
}

.scheduler-notice-chip--editable:hover {
  background: #ffe0b2;
}

.scheduler-grid-metrics-label,
.scheduler-grid-day-metric {
  padding: 6px 8px;
  background: #eef2f5;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

.scheduler-grid-metrics-label {
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #546e7a;
  border-left: 3px solid transparent;
}

.scheduler-grid-day-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 44px;
  border-left: 1px solid rgba(0, 0, 0, 0.06);
  user-select: none;
}

.scheduler-grid-day-metric--today {
  background: #e3f2fd;
}

.scheduler-grid-day-metric--holiday:not(.scheduler-grid-day-metric--today) {
  background: #f3e5f5;
}

.scheduler-grid-day-metric--editable {
  cursor: pointer;
}

.scheduler-grid-day-metric--editable:hover {
  background: #e8eef2;
}

.scheduler-grid-day-metric-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px;
  font-size: 11px;
  line-height: 1.25;
}

.scheduler-grid-day-metric-name {
  color: #607d8b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scheduler-grid-day-metric-value {
  font-weight: 700;
  color: #37474f;
  flex-shrink: 0;
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
  box-sizing: border-box;
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

.scheduler-employee-department {
  font-size: 11px;
  color: #607d8b;
  line-height: 1.2;
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

.scheduler-employee-accrued {
  font-size: 11px;
  color: #1565c0;
  font-weight: 500;
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

.scheduler-grid-employee-cell--notice {
  background: #fff8f0;
}

.scheduler-employee-notices {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
}

.scheduler-employee-notice-card {
  padding: 4px 6px;
  border-radius: 6px;
  background: #fff3e0;
  border: 1px solid #ffcc80;
  color: #e65100;
  max-width: 180px;
}

.scheduler-employee-notice-card--editable {
  cursor: pointer;
}

.scheduler-employee-notice-card--editable:hover {
  background: #ffe0b2;
}

.scheduler-employee-notice-title {
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scheduler-employee-notice-meta {
  margin-top: 1px;
  font-size: 10px;
  font-weight: 500;
  color: #ef6c00;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scheduler-grid-cell {
  min-height: 72px;
  padding: 6px;
  border-left: 1px solid rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  cursor: pointer;
  box-sizing: border-box;
}

.scheduler-grid-cell--selected {
  background: rgba(25, 118, 210, 0.14) !important;
  box-shadow: inset 0 0 0 2px rgba(25, 118, 210, 0.45);
}

.scheduler-grid-cell--past.scheduler-grid-cell--interactive {
  cursor: default;
}

.scheduler-grid--selecting {
  user-select: none;
  cursor: crosshair;
}

.scheduler-grid--selecting .scheduler-grid-cell--interactive:not(.scheduler-grid-cell--past) {
  cursor: crosshair;
}

.scheduler-shift-menu {
  width: min(340px, 90vw);
  padding: 8px 0 4px;
}

.scheduler-shift-menu__header {
  padding: 4px 16px 8px;
}

.scheduler-shift-menu__search {
  padding: 0 12px 8px;
}

.scheduler-shift-menu__loading {
  min-height: 96px;
}

.scheduler-shift-menu__list {
  max-height: 360px;
}

.scheduler-shift-menu__section {
  padding-top: 4px;
}

.scheduler-grid-cell--holiday {
  background: #faf5fc;
}

.scheduler-grid-cell--leave:not(.scheduler-grid-cell--holiday) {
  background: #e0f2f1;
}

.scheduler-grid-cell--leave.scheduler-grid-cell--holiday {
  background: linear-gradient(135deg, #e0f2f1 0%, #faf5fc 100%);
}

.scheduler-grid-cell--notice:not(.scheduler-grid-cell--holiday):not(.scheduler-grid-cell--leave) {
  background: #fff8f0;
}

.scheduler-leave-chip {
  border-radius: 6px;
  border: 1px solid rgba(0, 121, 107, 0.28);
  border-left: 4px solid #00897b;
  background: #b2dfdb;
  color: #004d40;
  padding: 4px 6px;
  margin-bottom: 4px;
  cursor: pointer;
}

.scheduler-leave-chip-label {
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scheduler-leave-chip-time {
  margin-top: 1px;
  font-size: 10px;
  font-weight: 600;
  opacity: 0.85;
}

.scheduler-grid-cell:hover {
  background: #f8fbff;
}

.scheduler-grid-cell--holiday:hover {
  background: #f3e5f5;
}

.scheduler-grid-cell--leave:not(.scheduler-grid-cell--holiday):hover {
  background: #b2dfdb;
}

.scheduler-grid-cell--notice:not(.scheduler-grid-cell--holiday):not(.scheduler-grid-cell--leave):hover {
  background: #ffefd9;
}

.scheduler-shift {
  border-radius: 8px;
  border: 1px solid rgba(25, 118, 210, 0.2);
  border-left-width: 4px;
  padding: 6px 8px;
  margin-bottom: 4px;
}

.scheduler-shift--preview {
  opacity: 0.92;
  border-width: 1px;
  border-left-width: 4px;
  border-style: dashed;
}

.scheduler-shift-preview-tag {
  margin-left: 4px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #b45309;
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

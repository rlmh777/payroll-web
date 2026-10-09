<template>
  <q-page class="employee-dashboard q-pa-md">
    <div v-if="store.isLoading" class="row justify-center q-pa-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <div v-else-if="store.error" class="q-pa-md">
      <q-banner class="bg-negative text-white" rounded>
        {{ store.error }}
        <template #action>
          <q-btn flat label="Retry" @click="reload" />
        </template>
      </q-banner>
    </div>

    <q-banner v-else-if="!data?.employee" class="bg-grey-2 text-grey-8" rounded>
      No employee record is linked to your user account, so your schedule, leave, and payslips cannot be shown.
    </q-banner>

    <div v-else class="employee-dashboard__grid">
      <q-card flat bordered class="panel panel--schedule">
        <q-card-section class="panel__header row items-center no-wrap">
          <div>
            <div class="text-subtitle2">My schedule</div>
            <div class="text-caption text-grey-7">View only</div>
          </div>
          <q-space />
          <q-btn flat dense icon="chevron_left" @click="shiftWeek(-1)" />
          <div class="text-caption text-weight-medium q-px-sm">{{ weekLabel }}</div>
          <q-btn flat dense icon="chevron_right" @click="shiftWeek(1)" />
          <q-btn flat dense label="This week" @click="goThisWeek" />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="schedule-week">
            <div
              v-for="day in data.schedule.days"
              :key="day.date"
              class="schedule-day"
              :class="scheduleDayClass(day)"
            >
              <div class="schedule-day__name">{{ day.weekday }}</div>
              <div class="schedule-day__date">{{ formatDay(day.date) }}</div>
              <div v-if="day.holiday" class="schedule-chip schedule-chip--holiday">{{ day.holiday.name }}</div>
              <div v-if="day.leave" class="schedule-chip schedule-chip--leave">{{ day.leave.leaveTypeName }}</div>
              <div v-if="day.shifts.length" class="schedule-shifts">
                <div v-for="shift in day.shifts" :key="shift.id" class="schedule-shift">
                  <div class="text-weight-medium">{{ formatShiftHours(shift) }}</div>
                  <div v-if="shift.worksiteName || shift.description" class="text-caption text-grey-7">
                    {{ shift.worksiteName || shift.description }}
                  </div>
                </div>
              </div>
              <div v-else-if="!day.holiday && !day.leave" class="text-caption text-grey-6 q-mt-xs">Off</div>
            </div>
          </div>
          <div class="schedule-legend">
            <span class="schedule-legend__item"><i class="schedule-legend__swatch schedule-legend__swatch--work" /> Work</span>
            <span class="schedule-legend__item"><i class="schedule-legend__swatch schedule-legend__swatch--off" /> Off</span>
            <span class="schedule-legend__item"><i class="schedule-legend__swatch schedule-legend__swatch--leave" /> Leave</span>
            <span class="schedule-legend__item"><i class="schedule-legend__swatch schedule-legend__swatch--holiday" /> Holiday</span>
            <span class="schedule-legend__item"><i class="schedule-legend__swatch schedule-legend__swatch--today" /> Today</span>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="panel panel--events">
        <q-card-section class="panel__header">Upcoming events</q-card-section>
        <q-card-section class="q-pt-none">
          <q-list v-if="data.upcomingEvents.length" separator dense>
            <q-item v-for="event in data.upcomingEvents" :key="event.id">
              <q-item-section avatar>
                <q-icon :name="eventIcon(event.type)" :color="eventColor(event.type)" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ event.title }}</q-item-label>
                <q-item-label caption>{{ formatEventDates(event) }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge outline :color="eventColor(event.type)" :label="eventLabel(event.type)" />
              </q-item-section>
            </q-item>
          </q-list>
          <div v-else class="text-caption text-grey-6">No upcoming holidays, events, or birthdays.</div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="panel panel--leaves">
        <q-card-section class="panel__header row items-center">
          Leave summary
          <q-space />
          <span v-if="data.leaves.asOf" class="text-caption text-grey-7">As of {{ formatAsOfDate(data.leaves.asOf) }}</span>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div v-if="data.leaves.balances.length" class="leave-cards">
            <q-card
              v-for="balance in data.leaves.balances"
              :key="balance.leaveTypeId"
              flat
              bordered
              clickable
              class="leave-card"
              :class="[`leave-card--${leaveCardTone(balance)}`, {
                'leave-card--empty': balance.affectsBalance && balance.availableDays <= 0,
                'leave-card--selected': isLeaveCardSelected(balance),
              }]"
              :aria-pressed="isLeaveCardSelected(balance) ? 'true' : 'false'"
              @click="openApplyLeave(balance)"
            >
              <q-card-section class="leave-card__body">
                <div class="leave-card__name">{{ balance.name }}</div>
                <div class="leave-card__available">
                  {{ balance.affectsBalance ? formatLeaveDays(balance.availableDays) : '—' }}
                </div>
                <div class="leave-card__available-label">available</div>
                <div class="leave-card__stat">
                  <div class="leave-card__stat-label">Taken</div>
                  <div class="leave-card__stat-value">{{ formatLeaveDays(balance.takenDays) }}</div>
                </div>
                <div class="leave-card__stat">
                  <div class="leave-card__stat-label">Scheduled</div>
                  <div class="leave-card__stat-value">{{ formatLeaveDays(balance.scheduledDays) }}</div>
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div v-else class="text-caption text-grey-6">No leave balances</div>
          <div v-if="data.leaves.upcoming.length" class="q-mt-md">
            <div class="text-caption text-grey-7 q-mb-xs">Upcoming leave</div>
            <q-list dense separator>
              <q-item v-for="leave in data.leaves.upcoming" :key="leave.id">
                <q-item-section>
                  <q-item-label>{{ leave.leaveTypeName }}</q-item-label>
                  <q-item-label caption>
                    {{ formatRange(leave.startDate, leave.endDate) }}
                    · {{ formatLeaveDays(leave.totalDays) }} day{{ leave.totalDays === 1 ? '' : 's' }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge outline :color="leaveStatusColor(leave.status)" :label="formatLeaveStatus(leave.status)" />
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>
      </q-card>

      <AddEmployeeLeave
        v-model="showApplyLeave"
        :title="applyLeaveTitle"
        submit-label="Request leave"
        :initial-leave-type-id="selectedLeaveTypeId"
        lock-leave-type
        :show-leave-type-actions="false"
        @saved="onLeaveRequested"
      />

      <q-card flat bordered class="panel panel--payslips">
        <q-card-section class="panel__header">Payslip history</q-card-section>
        <q-card-section class="q-pt-none">
          <q-table
            :rows="data.payslips"
            :columns="payslipColumns"
            row-key="id"
            flat
            dense
            hide-pagination
            :pagination="{ rowsPerPage: 0 }"
            no-data-label="No processed payslips"
          >
            <template #body-cell-actions="props">
              <q-td :props="props" class="text-right">
                <q-btn
                  flat
                  dense
                  color="primary"
                  icon="visibility"
                  label="View"
                  :loading="store.isOpeningPayslip && store.payslipBusyId === props.row.payrollRunId"
                  :disable="!props.row.payrollRunId || Boolean(store.payslipBusyId)"
                  @click="openPayslip(props.row.payrollRunId)"
                />
                <q-btn
                  flat
                  dense
                  color="primary"
                  icon="download"
                  label="Download"
                  :loading="store.isDownloadingPayslip && store.payslipBusyId === props.row.payrollRunId"
                  :disable="!props.row.payrollRunId || Boolean(store.payslipBusyId)"
                  @click="downloadPayslip(props.row)"
                />
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { QTableProps } from 'quasar';
import AddEmployeeLeave from '@hr/components/employee/leave/AddEmployeeLeave.vue';
import { formatLeaveDays } from '@hr/components/settings/leave/leave-type-form';
import { formatLeaveStatus, leaveStatusColor } from '@hr/utils/leave-status';
import { useEmployeeStore } from '@hr/stores/employee-store';
import type { Employee } from '@core/types/models';
import {
  useEmployeeDashboardStore,
  type EmployeeDashboardDay,
  type EmployeeDashboardEvent,
  type EmployeeDashboardLeaveBalance,
  type EmployeeDashboardPayslip,
  type EmployeeDashboardShift,
} from '@employee/stores/employee-dashboard-store';

const $q = useQuasar();
const store = useEmployeeDashboardStore();
const employeeStore = useEmployeeStore();
const weekStart = ref<string | undefined>(undefined);
const showApplyLeave = ref(false);
const selectedLeaveTypeId = ref<number | null>(null);

const data = computed(() => store.data);
const today = new Date().toISOString().slice(0, 10);

const applyLeaveTitle = computed(() => {
  const name = data.value?.leaves.balances.find(
    (balance) => balance.leaveTypeId === selectedLeaveTypeId.value,
  )?.name;
  return name ? `Request ${name}` : 'Request leave';
});

const weekLabel = computed(() => {
  const start = data.value?.schedule.start;
  const end = data.value?.schedule.end;
  if (!start || !end) {
    return '';
  }
  return `${formatDay(start)} – ${formatDay(end)}`;
});

const payslipColumns: QTableProps['columns'] = [
  { name: 'period', label: 'Period', field: (row) => formatRange(row.periodStart, row.periodEnd), align: 'left' },
  { name: 'number', label: 'Payroll #', field: 'payrollNumber', align: 'left' },
  { name: 'gross', label: 'Gross', field: (row) => formatMoney(row.grossSalary), align: 'right' },
  { name: 'net', label: 'Net', field: (row) => formatMoney(row.netSalary), align: 'right' },
  { name: 'actions', label: '', field: 'id', align: 'right' },
];

function formatDay(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatAsOfDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatRange(start?: string | null, end?: string | null): string {
  if (!start && !end) {
    return '—';
  }
  if (start && end && start !== end) {
    return `${formatDay(start)} – ${formatDay(end)}`;
  }
  return formatDay(start || end || '');
}

function formatShiftHours(shift: EmployeeDashboardShift): string {
  if (shift.startTime && shift.endTime) {
    return `${shift.startTime} – ${shift.endTime}`;
  }
  return shift.description || 'Scheduled';
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'BZD' }).format(value || 0);
}

function formatEventDates(event: EmployeeDashboardEvent): string {
  return formatRange(event.startDate, event.endDate);
}

function eventIcon(type: EmployeeDashboardEvent['type']): string {
  if (type === 'holiday') return 'event';
  if (type === 'birthday') return 'cake';
  return 'campaign';
}

function eventColor(type: EmployeeDashboardEvent['type']): string {
  if (type === 'holiday') return 'negative';
  if (type === 'birthday') return 'purple';
  return 'primary';
}

function eventLabel(type: EmployeeDashboardEvent['type']): string {
  if (type === 'holiday') return 'Holiday';
  if (type === 'birthday') return 'Birthday';
  return 'Event';
}

function scheduleDayClass(day: EmployeeDashboardDay): Record<string, boolean> {
  return {
    'schedule-day--today': day.date === today,
    'schedule-day--holiday': Boolean(day.holiday),
    'schedule-day--leave': Boolean(day.leave) && !day.holiday,
    'schedule-day--work': day.shifts.length > 0 && !day.holiday && !day.leave,
    'schedule-day--off': day.shifts.length === 0 && !day.holiday && !day.leave,
  };
}

function isLeaveCardSelected(balance: EmployeeDashboardLeaveBalance): boolean {
  return showApplyLeave.value && selectedLeaveTypeId.value === balance.leaveTypeId;
}

function leaveCardTone(balance: EmployeeDashboardLeaveBalance): string {
  const key = `${balance.code ?? ''} ${balance.name}`.toLowerCase();
  if (key.includes('vacation')) return 'vacation';
  if (key.includes('uncertified')) return 'sick-uncertified';
  if (key.includes('sick')) return 'sick';
  if (key.includes('paternity') || key.includes('maternity') || key.includes('parent')) return 'family';
  if (key.includes('professional') || key.includes('study') || key.includes('training')) return 'professional';
  if (key.includes('paid time') || /\bpto\b/.test(key)) return 'pto';
  if (balance.isPaid === false || key.includes('without pay') || key.includes('unpaid')) return 'unpaid';
  return 'default';
}

function mondayOf(date: Date): string {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy.toISOString().slice(0, 10);
}

async function reload() {
  await store.fetchDashboard(weekStart.value);
}

function goThisWeek() {
  weekStart.value = mondayOf(new Date());
  void reload();
}

function shiftWeek(direction: number) {
  const current = weekStart.value || data.value?.schedule.start || mondayOf(new Date());
  const date = new Date(`${current}T00:00:00`);
  date.setDate(date.getDate() + direction * 7);
  weekStart.value = mondayOf(date);
  void reload();
}

function openApplyLeave(balance: EmployeeDashboardLeaveBalance) {
  const employee = data.value?.employee;
  if (!employee?.id) {
    $q.notify({ type: 'negative', message: 'No employee record is linked to your account.' });
    return;
  }

  selectedLeaveTypeId.value = balance.leaveTypeId;
  if (employeeStore.selectedEmployee?.id !== employee.id) {
    employeeStore.selectedEmployee = {
      id: employee.id,
      code: employee.code ?? '',
      firstName: employee.name ?? '',
      lastName: '',
    } as Employee;
  }
  showApplyLeave.value = true;
}

function onLeaveRequested() {
  showApplyLeave.value = false;
  selectedLeaveTypeId.value = null;
  void reload();
}

watch(showApplyLeave, (open) => {
  if (!open) {
    selectedLeaveTypeId.value = null;
  }
});

async function openPayslip(payrollRunId: string) {
  const opened = await store.openPayslip(payrollRunId);
  if (!opened) {
    $q.notify({ type: 'negative', message: store.error || 'Failed to open payslip.' });
  }
}

function payslipFilename(row: EmployeeDashboardPayslip): string {
  const stamp = row.payrollNumber || row.periodEnd || row.id;
  return `payslip-${String(stamp).replace(/[^\w.-]+/g, '-')}.html`;
}

async function downloadPayslip(row: EmployeeDashboardPayslip) {
  const downloaded = await store.downloadPayslip(row.payrollRunId, payslipFilename(row));
  if (!downloaded) {
    $q.notify({ type: 'negative', message: store.error || 'Failed to download payslip.' });
    return;
  }
  $q.notify({ type: 'positive', message: 'Payslip downloaded.' });
}

onMounted(() => {
  weekStart.value = mondayOf(new Date());
  void reload();
});
</script>

<style scoped>
.employee-dashboard__grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 12px;
}

.panel__header {
  font-weight: 600;
}

.schedule-week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}

.schedule-day {
  min-height: 140px;
  padding: 8px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  background: #fff;
}

.schedule-day--work {
  background: #eff6ff;
  border-color: #93c5fd;
}

.schedule-day--off {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.schedule-day--holiday {
  background: #fef2f2;
  border-color: #fca5a5;
}

.schedule-day--leave {
  background: #ecfdf5;
  border-color: #6ee7b7;
}

.schedule-day--today {
  box-shadow: inset 0 0 0 2px #2563eb;
}

.schedule-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  margin-top: 12px;
}

.schedule-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #64748b;
}

.schedule-legend__swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 1px solid transparent;
  display: inline-block;
}

.schedule-legend__swatch--work {
  background: #eff6ff;
  border-color: #93c5fd;
}

.schedule-legend__swatch--off {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.schedule-legend__swatch--leave {
  background: #ecfdf5;
  border-color: #6ee7b7;
}

.schedule-legend__swatch--holiday {
  background: #fef2f2;
  border-color: #fca5a5;
}

.schedule-legend__swatch--today {
  background: #fff;
  box-shadow: inset 0 0 0 2px #2563eb;
}

.schedule-day__name {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
}

.schedule-day__date {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
}

.schedule-chip {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 999px;
  margin-bottom: 4px;
}

.schedule-chip--holiday {
  background: #fee2e2;
  color: #b91c1c;
}

.schedule-chip--leave {
  background: #dcfce7;
  color: #15803d;
}

.schedule-shift {
  font-size: 12px;
  margin-top: 4px;
}

.leave-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 108px));
  gap: 8px;
}

.leave-card {
  border-radius: 10px;
  border-top-width: 4px;
}

.leave-card:hover {
  filter: brightness(0.98);
}

.leave-cards:has(.leave-card--selected) .leave-card:not(.leave-card--selected) {
  opacity: 0.46;
}

.leave-card--selected {
  outline: 2px solid currentColor;
  outline-offset: 2px;
  z-index: 1;
  filter: none;
}

.leave-card--vacation.leave-card--selected {
  background: #bbf7d0;
  border-color: #16a34a;
}

.leave-card--sick.leave-card--selected {
  background: #fecaca;
  border-color: #dc2626;
}

.leave-card--sick-uncertified.leave-card--selected {
  background: #fed7aa;
  border-color: #ea580c;
}

.leave-card--family.leave-card--selected {
  background: #bfdbfe;
  border-color: #2563eb;
}

.leave-card--professional.leave-card--selected {
  background: #ddd6fe;
  border-color: #7c3aed;
}

.leave-card--pto.leave-card--selected {
  background: #99f6e4;
  border-color: #0d9488;
}

.leave-card--unpaid.leave-card--selected {
  background: #e2e8f0;
  border-color: #475569;
}

.leave-card--default.leave-card--selected {
  background: #bfdbfe;
  border-color: #2563eb;
}

.leave-card--vacation {
  background: #f0fdf4;
  border-color: #86efac;
  border-top-color: #16a34a;
  color: #15803d;
}

.leave-card--sick {
  background: #fef2f2;
  border-color: #fca5a5;
  border-top-color: #dc2626;
  color: #b91c1c;
}

.leave-card--sick-uncertified {
  background: #fff7ed;
  border-color: #fdba74;
  border-top-color: #ea580c;
  color: #c2410c;
}

.leave-card--family {
  background: #eff6ff;
  border-color: #93c5fd;
  border-top-color: #2563eb;
  color: #1d4ed8;
}

.leave-card--professional {
  background: #f5f3ff;
  border-color: #c4b5fd;
  border-top-color: #7c3aed;
  color: #6d28d9;
}

.leave-card--pto {
  background: #f0fdfa;
  border-color: #5eead4;
  border-top-color: #0d9488;
  color: #0f766e;
}

.leave-card--unpaid {
  background: #f8fafc;
  border-color: #cbd5e1;
  border-top-color: #64748b;
  color: #475569;
}

.leave-card--default {
  background: #f8fafc;
  border-color: #cbd5e1;
  border-top-color: #3b82f6;
  color: #2563eb;
}

.leave-card--empty .leave-card__available {
  color: #b91c1c;
}

.leave-card__body {
  padding: 8px 10px 10px;
}

.leave-card__name {
  font-size: 11px;
  font-weight: 700;
  line-height: 1.3;
  min-height: 2.6em;
}

.leave-card__available {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.1;
  margin-top: 2px;
}

.leave-card__available-label {
  font-size: 10px;
  opacity: 0.72;
  margin-bottom: 6px;
}

.leave-card__stat {
  margin-top: 4px;
}

.leave-card__stat-label {
  font-size: 10px;
  opacity: 0.72;
  line-height: 1.2;
}

.leave-card__stat-value {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}

@media (max-width: 1100px) {
  .employee-dashboard__grid {
    grid-template-columns: 1fr;
  }

  .schedule-week {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

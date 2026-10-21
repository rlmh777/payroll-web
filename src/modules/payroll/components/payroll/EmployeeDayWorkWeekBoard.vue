<template>
  <div>
    <div class="row items-center q-mb-sm q-col-gutter-sm">
      <div class="col-auto row items-center no-wrap">
        <q-btn flat dense round icon="chevron_left" @click="shiftWeek(-1)" />
        <div class="text-subtitle1 text-weight-medium q-px-sm">{{ weekLabel }}</div>
        <q-btn flat dense round icon="chevron_right" @click="shiftWeek(1)" />
        <q-btn flat dense no-caps label="This week" @click="goThisWeek" />
      </div>
      <div class="col-12 col-sm-4">
        <q-input
          v-model="employeeSearch"
          dense
          outlined
          clearable
          label="Find employee"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <q-space />
      <q-spinner v-if="loading" color="primary" size="20px" />
    </div>

    <div v-if="filteredEmployees.length === 0" class="text-caption text-grey-7 q-pa-sm">
      No daily-rate employees match.
    </div>

    <div v-else class="week-scroll">
      <div class="week-grid">
        <div class="week-sticky week-employee-header">Employee</div>
        <div
          v-for="day in weekDays"
          :key="day"
          class="week-day-header"
          :class="{ 'week-day-header--today': day === today }"
        >
          <div class="week-day-weekday">{{ dayHeader(day).weekday }}</div>
          <div class="week-day-date">{{ dayHeader(day).date }}</div>
        </div>

        <template v-for="employee in filteredEmployees" :key="employee.id">
          <div class="week-sticky week-employee-cell">
            <q-avatar
              size="32px"
              text-color="white"
              :style="{ backgroundColor: avatarColor(employee.lastName) }"
            >
              {{ lastInitial(employee.lastName) }}
            </q-avatar>
            <div class="week-employee-meta">
              <div class="week-employee-name ellipsis">{{ employeeTitle(employee) }}</div>
              <div class="week-employee-rate ellipsis">
                <span v-if="employee.code">{{ employee.code }} · </span>
                {{ formatCurrency(employee.dailyRate) }}/unit
              </div>
              <div class="week-employee-total ellipsis">
                {{ formatCurrency(weekTotal(employee.id)) }} week est.
              </div>
            </div>
          </div>

          <div
            v-for="day in weekDays"
            :key="`${employee.id}-${day}`"
            class="week-cell"
            :class="{ 'week-cell--today': day === today }"
            @click="emit('add', employee.id, day)"
          >
            <div
              v-for="entry in entriesFor(employee.id, day)"
              :key="entry.id"
              class="trip-chip"
              @click.stop="emit('edit', entry)"
            >
              <div class="trip-chip-title ellipsis">{{ entry.guest || 'Trip' }}</div>
              <div v-if="entry.destination" class="trip-chip-meta ellipsis">{{ entry.destination }}</div>
              <div v-if="entry.department?.name" class="trip-chip-meta ellipsis">{{ entry.department.name }}</div>
              <div class="row items-center no-wrap justify-between">
                <span class="trip-chip-meta">{{ entry.units }} · {{ formatCurrency(entry.amount) }}</span>
                <q-btn
                  flat
                  dense
                  round
                  size="xs"
                  icon="close"
                  color="negative"
                  @click.stop="emit('delete', entry)"
                />
              </div>
            </div>

            <q-btn
              flat
              dense
              round
              size="sm"
              icon="add"
              color="primary"
              class="week-cell-add"
              @click.stop="emit('add', employee.id, day)"
            >
              <q-tooltip>Add trip</q-tooltip>
            </q-btn>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { date } from 'quasar';
import { formatSchedulerDayHeader, getWeekDays } from '@hr/utils/scheduler-utils';
import {
  useEmployeeDayWorkStore,
  type DayWorkEmployeeOption,
  type EmployeeDayWork,
} from '@payroll/stores/employee-day-work-store';

const props = defineProps<{
  employees: DayWorkEmployeeOption[];
  refreshToken: number;
}>();

const emit = defineEmits<{
  add: [employeeId: string, day: string];
  edit: [entry: EmployeeDayWork];
  delete: [entry: EmployeeDayWork];
}>();

const store = useEmployeeDayWorkStore();
const employeeSearch = ref('');
const anchorDate = ref(date.formatDate(new Date(), 'YYYY-MM-DD'));
const today = date.formatDate(new Date(), 'YYYY-MM-DD');
const entries = ref<EmployeeDayWork[]>([]);
const loading = ref(false);

const weekDays = computed(() => getWeekDays(anchorDate.value));

const weekLabel = computed(() => {
  const days = weekDays.value;
  const start = days[0];
  const end = days[days.length - 1];
  if (!start || !end) return '';
  const startDate = date.extractDate(start, 'YYYY-MM-DD');
  const endDate = date.extractDate(end, 'YYYY-MM-DD');
  return `${date.formatDate(startDate, 'MMM D')} – ${date.formatDate(endDate, 'MMM D, YYYY')}`;
});

const filteredEmployees = computed(() => {
  const needle = employeeSearch.value.trim().toLowerCase();
  const rows = [...props.employees].sort((left, right) => employeeTitle(left).localeCompare(employeeTitle(right)));
  if (!needle) return rows;
  return rows.filter((employee) => {
    const displayName = (employee.displayName ?? '').toLowerCase();
    const firstName = (employee.firstName ?? '').toLowerCase();
    const lastName = (employee.lastName ?? '').toLowerCase();
    const code = (employee.code ?? '').toLowerCase();
    return displayName.includes(needle)
      || firstName.includes(needle)
      || lastName.includes(needle)
      || code.includes(needle);
  });
});

const weekTotals = computed(() => {
  const totals = new Map<string, number>();
  for (const entry of entries.value) {
    const amount = Number(entry.amount ?? Number(entry.units) * Number(entry.dailyRate));
    totals.set(entry.employeeId, (totals.get(entry.employeeId) ?? 0) + (Number.isFinite(amount) ? amount : 0));
  }
  return totals;
});

const entriesByCell = computed(() => {
  const grouped = new Map<string, EmployeeDayWork[]>();
  for (const entry of entries.value) {
    const key = `${entry.employeeId}|${dayKey(entry.date)}`;
    const current = grouped.get(key);
    if (current) current.push(entry);
    else grouped.set(key, [entry]);
  }
  return grouped;
});

function employeeTitle(employee: DayWorkEmployeeOption): string {
  const name = `${employee.lastName ?? ''}, ${employee.firstName ?? ''}`
    .replace(/^,\s*|,\s*$/g, '')
    .trim();
  return name || employee.displayName;
}

function lastInitial(lastName: string | undefined | null): string {
  if (!lastName) return '?';
  return lastName.charAt(0).toUpperCase();
}

function avatarColor(lastName: string | undefined | null): string {
  const colors = [
    '#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#c2185b', '#0097a7', '#5d4037', '#455a64',
    '#d32f2f', '#0288d1', '#00796b', '#8e24aa', '#e64a19', '#303f9f', '#c62828', '#558b2f',
  ];
  if (!lastName) return colors[0] ?? '#1976d2';
  return colors[lastName.charAt(0).toUpperCase().charCodeAt(0) % colors.length] ?? '#1976d2';
}

function formatCurrency(value: number | string | null | undefined): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value ?? 0));
}

function dayHeader(day: string) {
  return formatSchedulerDayHeader(day);
}

function dayKey(value: string): string {
  return String(value).slice(0, 10);
}

function entriesFor(employeeId: string, day: string): EmployeeDayWork[] {
  return entriesByCell.value.get(`${employeeId}|${day}`) ?? [];
}

function weekTotal(employeeId: string): number {
  return weekTotals.value.get(employeeId) ?? 0;
}

function shiftWeek(direction: -1 | 1) {
  const current = date.extractDate(anchorDate.value, 'YYYY-MM-DD');
  anchorDate.value = date.formatDate(date.addToDate(current, { days: direction * 7 }), 'YYYY-MM-DD');
}

function goThisWeek() {
  anchorDate.value = today;
}

async function loadWeek() {
  const days = weekDays.value;
  const start = days[0];
  const end = days[days.length - 1];
  if (!start || !end) {
    entries.value = [];
    return;
  }

  loading.value = true;
  try {
    entries.value = await store.fetchAllInRange(start, end);
  } catch (error) {
    entries.value = [];
    store.error = error instanceof Error ? error.message : 'Failed to load day / trip work entries.';
  } finally {
    loading.value = false;
  }
}

watch([anchorDate, () => props.refreshToken], () => {
  void loadWeek();
}, { immediate: true });
</script>

<style scoped>
.week-scroll {
  overflow: auto;
  max-height: calc(100vh - 280px);
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: #fafafa;
}

.week-grid {
  display: grid;
  grid-template-columns: 220px repeat(7, minmax(148px, 1fr));
  min-width: 1260px;
}

.week-sticky {
  position: sticky;
  left: 0;
  z-index: 2;
  background: #fff;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

.week-employee-header,
.week-day-header {
  position: sticky;
  top: 0;
  z-index: 3;
  padding: 12px;
  font-weight: 600;
  background: #f5f5f5;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

.week-employee-header {
  z-index: 4;
  display: flex;
  align-items: center;
}

.week-day-header {
  text-align: center;
  border-left: 1px solid rgba(0, 0, 0, 0.06);
}

.week-day-header--today {
  background: #e3f2fd;
  color: #1565c0;
}

.week-day-weekday {
  font-size: 11px;
  letter-spacing: 0.04em;
}

.week-day-date {
  font-size: 18px;
  line-height: 1.2;
}

.week-employee-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 72px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.week-employee-meta {
  min-width: 0;
}

.week-employee-name {
  font-weight: 600;
  line-height: 1.2;
}

.week-employee-rate {
  font-size: 12px;
  color: #757575;
}

.week-employee-total {
  font-size: 12px;
  font-weight: 600;
  color: #1565c0;
}

.week-cell {
  position: relative;
  min-height: 72px;
  padding: 6px;
  border-left: 1px solid rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  cursor: pointer;
  box-sizing: border-box;
}

.week-cell--today {
  background: #f7fbff;
}

.week-cell:hover {
  background: rgba(25, 118, 210, 0.06);
}

.week-cell-add {
  opacity: 0;
}

.week-cell:hover .week-cell-add {
  opacity: 1;
}

.trip-chip {
  margin-bottom: 4px;
  padding: 4px 6px;
  border-radius: 4px;
  background: #e3f2fd;
  border-left: 3px solid #1976d2;
  cursor: pointer;
}

.trip-chip-title {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
}

.trip-chip-meta {
  font-size: 11px;
  color: #546e7a;
  line-height: 1.2;
}
</style>

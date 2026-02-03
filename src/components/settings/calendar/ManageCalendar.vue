<template>
  <div class="calendar-shell">
    <CalendarSidebar
      v-model:selectedDate="selectedDate"
      v-model:activeFilterList="activeFilterList"
      :mini-label="miniLabel"
      :filter-options="filterOptions"
      @create="openCreateDialog"
      @mini-prev="miniPrev"
      @mini-next="miniNext"
    />

    <section class="calendar-main">
      <CalendarTopbar
        v-model:viewMode="viewMode"
        :view-options="viewOptions"
        :header-label="headerLabel"
        @prev="prevPeriod"
        @next="nextPeriod"
        @today="goToday"
      />

      <q-card class="calendar-surface">
        <CalendarViews
          :view-mode="viewMode"
          :year-months="yearMonths"
          :selected-date="selectedDate"
          :day-label="dayLabel"
          :events-for-selected="eventsForSelected"
          :type-labels="typeLabels"
          :type-colors="typeColors"
          :get-slot-date="getSlotDate"
          :events-for-slot="eventsForSlot"
          :month-label="monthLabel"
          :on-click-day="onClickDay"
          :type-chip-color="typeChipColor"
          :remove-event="removeEvent"
        />
      </q-card>
    </section>

    <CalendarCreateDialog
      v-model:show="showCreate"
      v-model:description="eventDescription"
      v-model:date="selectedDate"
      v-model:type="eventType"
      v-model:multiplier="eventMultiplier"
      :event-type-options="eventTypeOptions"
      :can-add="canAdd"
      @save="handleCreate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { date, useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useCalendarStore } from 'src/stores/calendar-store';
import CalendarSidebar from './CalendarSidebar.vue';
import CalendarTopbar from './CalendarTopbar.vue';
import CalendarViews from './CalendarViews.vue';
import CalendarCreateDialog from './CalendarCreateDialog.vue';
import type { CalendarType, FilterOption } from './calendarTypes';

const $q = useQuasar();
const calendarStore = useCalendarStore();
const { calendars, error } = storeToRefs(calendarStore);

const selectedDate = ref(date.formatDate(Date.now(), 'YYYY-MM-DD'));
const viewMode = ref<'month' | 'year' | 'day'>('month');
const viewOptions: Array<{ label: string; value: 'day' | 'month' | 'year' }> = [
  { label: 'Day', value: 'day' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];

const eventDescription = ref('');
const eventMultiplier = ref(1);
const eventType = ref<CalendarType>('holiday');
const showCreate = ref(false);

const eventTypeOptions: Array<{ label: string; value: CalendarType }> = [
  { label: 'Holiday', value: 'holiday' },
  { label: 'Vacation', value: 'vacation' },
  { label: 'Sick', value: 'sick' },
  { label: 'Other', value: 'other' },
];

const filterOptions: FilterOption[] = [
  { label: 'Holiday', value: 'holiday' },
  { label: 'Vacation', value: 'vacation' },
  { label: 'Sick', value: 'sick' },
  { label: 'Other', value: 'other' },
];

const typeColors: Record<CalendarType, string> = {
  holiday: '#4f6bed',
  vacation: '#00a389',
  sick: '#f0423a',
  other: '#8f95a3',
};

const typeLabels: Record<CalendarType, string> = {
  holiday: 'Holiday',
  vacation: 'Vacation',
  sick: 'Sick',
  other: 'Other',
};

const activeFilterList = ref<CalendarType[]>(['holiday', 'vacation', 'sick', 'other']);
const activeFilters = computed(() => new Set(activeFilterList.value));

const viewYear = ref(Number(selectedDate.value.slice(0, 4)));
const yearMonths = computed(() =>
  Array.from(
    { length: 12 },
    (_, index) => `${viewYear.value}-${String(index + 1).padStart(2, '0')}-01`,
  ),
);

const eventsForSelected = computed(() =>
  calendars.value.filter(
    (event) => event.date === selectedDate.value && activeFilters.value.has(event.type ?? 'other'),
  ),
);

const canAdd = computed(
  () => eventDescription.value.trim().length > 0 && selectedDate.value.length > 0,
);

const headerLabel = computed(() => {
  const parsed = date.extractDate(selectedDate.value, 'YYYY-MM-DD');
  if (viewMode.value === 'year') {
    return date.formatDate(parsed, 'YYYY');
  }
  if (viewMode.value === 'day') {
    return date.formatDate(parsed, 'dddd, MMMM D');
  }
  return date.formatDate(parsed, 'MMMM YYYY');
});

const miniLabel = computed(() => {
  const parsed = date.extractDate(selectedDate.value, 'YYYY-MM-DD');
  return date.formatDate(parsed, 'MMMM YYYY');
});

const dayLabel = computed(() => {
  const parsed = date.extractDate(selectedDate.value, 'YYYY-MM-DD');
  return date.formatDate(parsed, 'dddd, MMMM D, YYYY');
});

function typeChipColor(type?: CalendarType) {
  const color = typeColors[type ?? 'other'];
  return color.replace('#', '');
}

function getMonthRange(value: string) {
  const parsed = date.extractDate(value, 'YYYY-MM-DD');
  return {
    start: date.formatDate(date.startOfDate(parsed, 'month'), 'YYYY-MM-DD'),
    end: date.formatDate(date.endOfDate(parsed, 'month'), 'YYYY-MM-DD'),
  };
}

function getYearRange(yearValue: number) {
  return {
    start: `${yearValue}-01-01`,
    end: `${yearValue}-12-31`,
  };
}

async function fetchEvents() {
  const { start, end } =
    viewMode.value === 'year' ? getYearRange(viewYear.value) : getMonthRange(selectedDate.value);
  await calendarStore.fetchCalendars({ start, end, perPage: 200 });

  if (error.value) {
    $q.notify({ type: 'negative', message: error.value });
  }
}

function getSlotDate(slotProps: unknown): string | null {
  if (!slotProps || typeof slotProps !== 'object') return null;
  const typed = slotProps as {
    timestamp?: { date?: string };
    scope?: { timestamp?: { date?: string } };
  };
  return typed.timestamp?.date ?? typed.scope?.timestamp?.date ?? null;
}

function eventsForDate(value: string) {
  return calendars.value.filter(
    (event) => event.date === value && activeFilters.value.has(event.type ?? 'other'),
  );
}

function eventsForSlot(slotProps: unknown) {
  const slotDate = getSlotDate(slotProps);
  return slotDate ? eventsForDate(slotDate) : [];
}

function onClickDay(payload: unknown) {
  if (!payload || typeof payload !== 'object') return;
  const typed = payload as { scope?: { timestamp?: { date?: string } } };
  const picked = typed.scope?.timestamp?.date;
  if (picked) {
    selectedDate.value = picked;
  }
}

function monthLabel(value: string) {
  const parsed = date.extractDate(value, 'YYYY-MM-DD');
  return date.formatDate(parsed, 'MMMM');
}

function prevPeriod() {
  const parsed = date.extractDate(selectedDate.value, 'YYYY-MM-DD');
  if (viewMode.value === 'year') {
    viewYear.value -= 1;
    selectedDate.value = `${viewYear.value}-01-01`;
  } else if (viewMode.value === 'day') {
    selectedDate.value = date.formatDate(date.subtractFromDate(parsed, { days: 1 }), 'YYYY-MM-DD');
  } else {
    selectedDate.value = date.formatDate(
      date.subtractFromDate(parsed, { months: 1 }),
      'YYYY-MM-DD',
    );
  }
}

function nextPeriod() {
  const parsed = date.extractDate(selectedDate.value, 'YYYY-MM-DD');
  if (viewMode.value === 'year') {
    viewYear.value += 1;
    selectedDate.value = `${viewYear.value}-01-01`;
  } else if (viewMode.value === 'day') {
    selectedDate.value = date.formatDate(date.addToDate(parsed, { days: 1 }), 'YYYY-MM-DD');
  } else {
    selectedDate.value = date.formatDate(date.addToDate(parsed, { months: 1 }), 'YYYY-MM-DD');
  }
}

function goToday() {
  selectedDate.value = date.formatDate(Date.now(), 'YYYY-MM-DD');
}

function miniPrev() {
  const parsed = date.extractDate(selectedDate.value, 'YYYY-MM-DD');
  selectedDate.value = date.formatDate(date.subtractFromDate(parsed, { months: 1 }), 'YYYY-MM-DD');
}

function miniNext() {
  const parsed = date.extractDate(selectedDate.value, 'YYYY-MM-DD');
  selectedDate.value = date.formatDate(date.addToDate(parsed, { months: 1 }), 'YYYY-MM-DD');
}

function openCreateDialog() {
  showCreate.value = true;
}

async function handleCreate() {
  if (!canAdd.value) return;

  const result = await calendarStore.createCalendar({
    date: selectedDate.value,
    type: eventType.value,
    description: eventDescription.value.trim(),
    multiplier: eventMultiplier.value,
  });

  if (result) {
    eventDescription.value = '';
    eventMultiplier.value = 1;
    eventType.value = 'holiday';
    showCreate.value = false;
    await fetchEvents();
    $q.notify({ type: 'positive', message: 'Calendar entry saved.' });
  } else if (error.value) {
    $q.notify({ type: 'negative', message: error.value });
  }
}

async function removeEvent(id: string) {
  try {
    await calendarStore.deleteCalendar(id);
    $q.notify({ type: 'positive', message: 'Calendar entry removed.' });
  } catch (storeError) {
    const message =
      storeError instanceof Error ? storeError.message : 'Failed to remove calendar entry.';
    $q.notify({ type: 'negative', message });
  }
}

watch(
  () => selectedDate.value,
  async (next, prev) => {
    viewYear.value = Number(next.slice(0, 4));
    if (
      date.formatDate(date.extractDate(next, 'YYYY-MM-DD'), 'YYYY-MM') !==
      date.formatDate(date.extractDate(prev, 'YYYY-MM-DD'), 'YYYY-MM')
    ) {
      await fetchEvents();
    }
  },
);

watch([viewMode, viewYear], async () => {
  await fetchEvents();
});

onMounted(async () => {
  await fetchEvents();
});
</script>

<style scoped>
.calendar-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 24px;
}

.calendar-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.calendar-surface {
  padding: 16px;
  border-radius: 18px;
  background: #ffffff;
  color: #1d1d1d;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

@media (max-width: 1024px) {
  .calendar-shell {
    grid-template-columns: 1fr;
  }
}
</style>

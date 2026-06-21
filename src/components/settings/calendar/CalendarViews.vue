<template>
  <div>
    <div v-if="viewMode === 'year'" class="calendar-year-grid">
      <div v-for="month in yearMonths" :key="month" class="calendar-year-item">
        <div class="text-caption text-grey-6 q-mb-xs">{{ monthLabel(month) }}</div>
        <q-calendar
          :model-value="month"
          mode="month"
          bordered
          animated
          mini-mode
          :day-min-height="18"
          :day-padding="'2px'"
          :selected-dates="[selectedDate]"
          @click-day="onClickDay"
          class="calendar-view calendar-view--mini"
        >
          <template #day="slotProps">
            <div v-if="getSlotDate(slotProps)" class="calendar-day calendar-day--mini">
              <div
                v-for="entry in eventsForSlot(slotProps)"
                :key="entry.id"
                class="calendar-day-item calendar-day-item--mini"
              >
                    <span
                      class="calendar-dot"
                      :style="{ backgroundColor: eventColor(entry) }"
                    ></span>
              </div>
            </div>
          </template>
        </q-calendar>
      </div>
    </div>

    <div v-else-if="viewMode === 'day'" class="calendar-day-view">
      <div class="text-subtitle1 q-mb-sm">{{ dayLabel }}</div>
      <q-list bordered separator>
        <q-item v-for="event in eventsForSelected" :key="event.id">
          <q-item-section avatar>
            <q-icon name="event" :color="typeChipColor(event.type)" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ event.description }}</q-item-label>
            <q-item-label caption>
              {{ typeLabels[event.type ?? 'other'] }} · Rate: {{ event.rate }}
            </q-item-label>
          </q-item-section>
        </q-item>
        <div v-if="!eventsForSelected.length" class="text-grey-6 q-pa-md">
          No events for this day.
        </div>
      </q-list>
    </div>

    <q-calendar
      v-else
      :model-value="selectedDate"
      mode="month"
      bordered
      animated
      :selected-dates="[selectedDate]"
      @click-day="onClickDay"
      class="calendar-view"
    >
      <template #day="slotProps">
        <div v-if="getSlotDate(slotProps)" class="calendar-day">
          <div
            v-for="entry in eventsForSlot(slotProps)"
            :key="entry.id"
            class="calendar-day-item"
          >
              <span
                class="calendar-dot"
                :style="{ backgroundColor: eventColor(entry) }"
              ></span>
            <span class="calendar-day-text">{{ entry.description }}</span>
          </div>
        </div>
      </template>
    </q-calendar>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { QCalendar } from '@quasar/quasar-ui-qcalendar';
import type { CalendarEntry } from 'src/stores/calendar-store';
import type { CalendarType } from './calendarTypes';

defineProps({
  viewMode: {
    type: String as PropType<'day' | 'month' | 'year'>,
    required: true,
  },
  yearMonths: {
    type: Array as PropType<string[]>,
    required: true,
  },
  selectedDate: {
    type: String,
    required: true,
  },
  dayLabel: {
    type: String,
    required: true,
  },
  eventsForSelected: {
    type: Array as PropType<CalendarEntry[]>,
    required: true,
  },
  typeLabels: {
    type: Object as PropType<Record<CalendarType, string>>,
    required: true,
  },
  eventColor: {
    type: Function as PropType<(event: CalendarEntry) => string>,
    required: true,
  },
  getSlotDate: {
    type: Function as PropType<(slotProps: unknown) => string | null>,
    required: true,
  },
  eventsForSlot: {
    type: Function as PropType<(slotProps: unknown) => CalendarEntry[]>,
    required: true,
  },
  monthLabel: {
    type: Function as PropType<(value: string) => string>,
    required: true,
  },
  onClickDay: {
    type: Function as PropType<(payload: unknown) => void>,
    required: true,
  },
  typeChipColor: {
    type: Function as PropType<(type?: CalendarType) => string>,
    required: true,
  },
});
</script>

<style scoped>
.calendar-view {
  min-height: 560px;
  background: transparent;
}

.calendar-view--mini {
  min-height: 220px;
}

.calendar-year-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.calendar-year-item {
  padding: 8px;
  border-radius: 12px;
  background: #f7f7f9;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
}

.calendar-day {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 2px 0;
}

.calendar-day--mini {
  gap: 2px;
}

.calendar-day-item {
  display: flex;
  align-items: center;
  font-size: 11px;
  line-height: 1.2;
  color: #3a3a3a;
}

.calendar-day-item--mini {
  font-size: 9px;
}

.calendar-day-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 110px;
}

.calendar-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
  margin-right: 8px;
}

.calendar-day-view {
  padding: 8px;
}
</style>

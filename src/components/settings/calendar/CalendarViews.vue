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
          :selected-start-end-dates="selectedStartEndDates"
          :hover="rangeHover"
          @click-day="onClickDay"
          @mousedown-day="onMouseDownDay"
          @mouseup-day="onMouseUpDay"
          @mouseenter-day="onMouseEnterDay"
          class="calendar-view calendar-view--mini"
        >
          <template #day="slotProps">
            <div v-if="getSlotDate(slotProps)" class="calendar-day calendar-day--mini">
              <div
                v-for="entry in eventsForSlot(slotProps)"
                :key="entry.id"
                class="calendar-day-item calendar-day-item--mini calendar-day-item--clickable"
                @mousedown.stop
                @mouseup.stop
                @click.stop="emit('select-event', entry)"
              >
                <q-tooltip anchor="top middle" self="bottom middle" :delay="400">
                  <div class="calendar-event-tooltip">
                    <div v-for="line in tooltipLines(entry)" :key="line">{{ line }}</div>
                  </div>
                </q-tooltip>
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
        <q-item
          v-for="event in eventsForSelected"
          :key="event.id"
          clickable
          @click="emit('select-event', event)"
        >
          <q-tooltip anchor="top middle" self="bottom middle" :delay="400">
            <div class="calendar-event-tooltip">
              <div v-for="line in tooltipLines(event)" :key="line">{{ line }}</div>
            </div>
          </q-tooltip>
          <q-item-section avatar>
            <q-icon name="event" :color="typeChipColor(event.type)" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ event.description }}</q-item-label>
            <q-item-label caption>
              {{ eventCaption(event) }}
            </q-item-label>
          </q-item-section>
        </q-item>
        <div v-if="!eventsForSelected.length" class="text-grey-6 q-pa-md">
          No events for this day.
        </div>
      </q-list>
      <div class="q-mt-md">
        <q-btn
          color="primary"
          icon="add"
          label="Create event for this day"
          unelevated
          @click="emit('create-day', selectedDate)"
        />
      </div>
    </div>

    <q-calendar
      v-else
      :model-value="selectedDate"
      mode="month"
      bordered
      animated
      :selected-dates="[selectedDate]"
      :selected-start-end-dates="selectedStartEndDates"
      :hover="rangeHover"
      @click-day="onClickDay"
      @mousedown-day="onMouseDownDay"
      @mouseup-day="onMouseUpDay"
      @mouseenter-day="onMouseEnterDay"
      class="calendar-view"
    >
      <template #day="slotProps">
        <div v-if="getSlotDate(slotProps)" class="calendar-day">
          <div
            v-for="entry in eventsForSlot(slotProps)"
            :key="entry.id"
            class="calendar-day-item calendar-day-item--clickable"
            @mousedown.stop
            @mouseup.stop
            @click.stop="emit('select-event', entry)"
          >
            <q-tooltip anchor="top middle" self="bottom middle" :delay="400">
              <div class="calendar-event-tooltip">
                <div v-for="line in tooltipLines(entry)" :key="line">{{ line }}</div>
              </div>
            </q-tooltip>
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
import { eventTooltipLines } from 'src/utils/calendar-event-utils';

const emit = defineEmits<{
  (event: 'select-event', value: CalendarEntry): void;
  (event: 'create-day', value: string): void;
}>();

const props = defineProps({
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
  selectedStartEndDates: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  rangeHover: {
    type: Boolean,
    default: false,
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
  onMouseDownDay: {
    type: Function as PropType<(payload: unknown) => void>,
    required: true,
  },
  onMouseUpDay: {
    type: Function as PropType<(payload: unknown) => void>,
    required: true,
  },
  onMouseEnterDay: {
    type: Function as PropType<(payload: unknown) => void>,
    required: true,
  },
  typeChipColor: {
    type: Function as PropType<(type?: CalendarType) => string>,
    required: true,
  },
});

function tooltipLines(event: CalendarEntry) {
  return eventTooltipLines(event, props.typeLabels);
}

function eventCaption(event: CalendarEntry) {
  return props.typeLabels[event.type] ?? event.type;
}
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
  min-height: 100%;
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
  flex-shrink: 0;
}

.calendar-day-item--clickable {
  cursor: pointer;
}

.calendar-day-item--clickable:hover .calendar-day-text {
  text-decoration: underline;
}

.calendar-event-tooltip {
  white-space: pre-line;
  max-width: 280px;
}
</style>

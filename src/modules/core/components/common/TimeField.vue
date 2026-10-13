<template>
  <q-input
    ref="inputRef"
    :model-value="displayTime"
    :label="label"
    outlined
    dense
    :stack-label="stackLabel"
    :clearable="clearable"
    :disable="disable"
    mask="##:##"
    :rules="allRules"
    @update:model-value="onInputUpdate"
  >
    <template #append>
      <q-btn
        unelevated
        no-caps
        dense
        :label="period"
        :disable="disable"
        tabindex="-1"
        class="time-field-period"
        @click.stop.prevent="togglePeriod"
      />
      <q-btn
        unelevated
        dense
        round
        icon="schedule"
        :disable="disable"
        tabindex="-1"
        class="time-field-clock"
      >
        <q-popup-proxy
          v-model="pickerOpen"
          cover
          transition-show="scale"
          transition-hide="scale"
        >
          <q-card class="time-field-popup" flat>
            <div class="time-field-popup-row">
              <div class="time-spinner">
                <q-btn
                  flat
                  dense
                  round
                  icon="keyboard_arrow_up"
                  color="grey-7"
                  @click="bumpHour(1)"
                />
                <input
                  v-model="hourText"
                  class="time-spinner-value"
                  inputmode="numeric"
                  maxlength="2"
                  aria-label="Hour"
                  @focus="selectInputValue"
                  @input="onHourTyped"
                  @blur="commitHourText"
                  @keydown.enter.prevent="commitHourText"
                  @keydown.up.prevent="bumpHour(1)"
                  @keydown.down.prevent="bumpHour(-1)"
                  @click.stop
                  @mousedown.stop
                >
                <q-btn
                  flat
                  dense
                  round
                  icon="keyboard_arrow_down"
                  color="grey-7"
                  @click="bumpHour(-1)"
                />
              </div>

              <div class="time-spinner-colon">:</div>

              <div class="time-spinner">
                <q-btn
                  flat
                  dense
                  round
                  icon="keyboard_arrow_up"
                  color="grey-7"
                  @click="bumpMinute(1)"
                />
                <input
                  v-model="minuteText"
                  class="time-spinner-value"
                  inputmode="numeric"
                  maxlength="2"
                  aria-label="Minute"
                  @focus="selectInputValue"
                  @input="onMinuteTyped"
                  @blur="commitMinuteText"
                  @keydown.enter.prevent="commitMinuteText"
                  @keydown.up.prevent="bumpMinute(1)"
                  @keydown.down.prevent="bumpMinute(-1)"
                  @click.stop
                  @mousedown.stop
                >
                <q-btn
                  flat
                  dense
                  round
                  icon="keyboard_arrow_down"
                  color="grey-7"
                  @click="bumpMinute(-1)"
                />
              </div>

              <div class="time-period-stack">
                <q-btn
                  unelevated
                  no-caps
                  :color="draft.period === 'AM' ? 'primary' : 'grey-3'"
                  :text-color="draft.period === 'AM' ? 'white' : 'grey-7'"
                  label="AM"
                  class="time-period-btn"
                  @click="setDraftPeriod('AM')"
                />
                <q-btn
                  unelevated
                  no-caps
                  :color="draft.period === 'PM' ? 'primary' : 'grey-3'"
                  :text-color="draft.period === 'PM' ? 'white' : 'grey-7'"
                  label="PM"
                  class="time-period-btn"
                  @click="setDraftPeriod('PM')"
                />
              </div>
            </div>
          </q-card>
        </q-popup-proxy>
      </q-btn>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { QInput, ValidationRule } from 'quasar';

export type TimeFieldRule = (val: string | null) => boolean | string;
type DayPeriod = 'AM' | 'PM';
type TimeParts = { hour12: number; minutes: number; period: DayPeriod };

const props = withDefaults(defineProps<{
  modelValue: string | null;
  label: string;
  disable?: boolean;
  clearable?: boolean;
  required?: boolean;
  stackLabel?: boolean;
  rules?: TimeFieldRule[];
}>(), {
  disable: false,
  clearable: false,
  required: false,
  stackLabel: false,
  rules: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
}>();

const inputRef = ref<QInput | null>(null);
const pickerOpen = ref(false);
const localPeriod = ref<DayPeriod>('AM');
const draft = ref<TimeParts>({ hour12: 9, minutes: 0, period: 'AM' });
const hourText = ref('09');
const minuteText = ref('00');

const parsedValue = computed(() => parseHHmm(props.modelValue));

const displayTime = computed(() => {
  const parts = to12HourParts(props.modelValue);
  if (!parts) {
    return '';
  }
  return `${pad(parts.hour12)}:${pad(parts.minutes)}`;
});

const period = computed<DayPeriod>(() => to12HourParts(props.modelValue)?.period ?? localPeriod.value);

const allRules = computed((): ValidationRule[] => {
  const customRules = (props.rules ?? []).map(toValidationRule);
  if (!props.required) {
    return customRules;
  }
  return [
    toValidationRule((val) => Boolean(parseHHmm(val)) || `${stripRequiredMark(props.label)} is required`),
    ...customRules,
  ];
});

watch(
  () => props.modelValue,
  async () => {
    await nextTick();
    await inputRef.value?.validate();
  },
);

watch(pickerOpen, (open) => {
  if (!open) {
    return;
  }
  const parts = to12HourParts(props.modelValue);
  if (parts) {
    draft.value = parts;
    syncDraftText();
    return;
  }
  draft.value = {
    hour12: 9,
    minutes: 0,
    period: localPeriod.value,
  };
  syncDraftText();
  commitDraft();
});

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function stripRequiredMark(label: string): string {
  return label.replace(/\s*\*\s*$/, '').trim();
}

function parseHHmm(value?: string | null): { hours: number; minutes: number } | null {
  if (!value) {
    return null;
  }
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 23 || minutes > 59) {
    return null;
  }
  return { hours, minutes };
}

function toHHmm(hours: number, minutes: number): string {
  return `${pad(hours)}:${pad(minutes)}`;
}

function to12HourParts(value?: string | null): TimeParts | null {
  const parsed = parseHHmm(value);
  if (!parsed) {
    return null;
  }
  const nextPeriod: DayPeriod = parsed.hours >= 12 ? 'PM' : 'AM';
  let hour12 = parsed.hours % 12;
  if (hour12 === 0) {
    hour12 = 12;
  }
  return { hour12, minutes: parsed.minutes, period: nextPeriod };
}

function from12Hour(hour12: number, minutes: number, nextPeriod: DayPeriod): string {
  let hours = hour12 % 12;
  if (nextPeriod === 'PM') {
    hours += 12;
  }
  return toHHmm(hours, minutes);
}

function toValidationRule(rule: TimeFieldRule): ValidationRule {
  return () => rule(parsedValue.value ? toHHmm(parsedValue.value.hours, parsedValue.value.minutes) : null);
}

function onInputUpdate(value: string | null | number) {
  const raw = value === null || value === undefined ? '' : String(value).trim();
  if (!raw) {
    emit('update:modelValue', null);
    return;
  }

  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return;
  }

  let hour12 = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hour12) || !Number.isFinite(minutes) || minutes > 59) {
    return;
  }
  if (hour12 === 0) {
    hour12 = 12;
  }
  if (hour12 < 1 || hour12 > 12) {
    return;
  }

  emit('update:modelValue', from12Hour(hour12, minutes, period.value));
}

function togglePeriod() {
  const nextPeriod: DayPeriod = period.value === 'AM' ? 'PM' : 'AM';
  localPeriod.value = nextPeriod;
  const parts = to12HourParts(props.modelValue);
  if (!parts) {
    return;
  }
  emit('update:modelValue', from12Hour(parts.hour12, parts.minutes, nextPeriod));
}

function commitDraft() {
  localPeriod.value = draft.value.period;
  emit('update:modelValue', from12Hour(draft.value.hour12, draft.value.minutes, draft.value.period));
}

function syncDraftText() {
  hourText.value = pad(draft.value.hour12);
  minuteText.value = pad(draft.value.minutes);
}

function digitsOnly(value: string, maxLength: number): string {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

function selectInputValue(event: FocusEvent) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) {
    return;
  }
  input.select();
}

function onHourTyped() {
  hourText.value = digitsOnly(hourText.value, 2);
  if (hourText.value.length === 2) {
    commitHourText();
  }
}

function onMinuteTyped() {
  minuteText.value = digitsOnly(minuteText.value, 2);
  if (minuteText.value.length === 2) {
    commitMinuteText();
  }
}

function commitHourText() {
  const parsed = Number(hourText.value);
  let hour12 = draft.value.hour12;
  if (Number.isFinite(parsed) && parsed === 0) {
    hour12 = 12;
  } else if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 12) {
    hour12 = parsed;
  }
  draft.value = { ...draft.value, hour12 };
  hourText.value = pad(hour12);
  commitDraft();
}

function commitMinuteText() {
  const parsed = Number(minuteText.value);
  const minutes = Number.isFinite(parsed) && parsed >= 0 && parsed <= 59
    ? parsed
    : draft.value.minutes;
  draft.value = { ...draft.value, minutes };
  minuteText.value = pad(minutes);
  commitDraft();
}

function bumpHour(delta: number) {
  let hour12 = draft.value.hour12 + delta;
  if (hour12 > 12) {
    hour12 = 1;
  } else if (hour12 < 1) {
    hour12 = 12;
  }
  draft.value = { ...draft.value, hour12 };
  hourText.value = pad(hour12);
  commitDraft();
}

function bumpMinute(delta: number) {
  let minutes = draft.value.minutes + delta;
  if (minutes > 59) {
    minutes = 0;
  } else if (minutes < 0) {
    minutes = 59;
  }
  draft.value = { ...draft.value, minutes };
  minuteText.value = pad(minutes);
  commitDraft();
}

function setDraftPeriod(nextPeriod: DayPeriod) {
  draft.value = { ...draft.value, period: nextPeriod };
  commitDraft();
}
</script>

<style scoped>
.time-field-period {
  min-width: 42px;
  height: 28px;
  padding: 0 8px;
  border-radius: 10px;
  background: #eef1f6;
  color: #6b7a90;
  font-weight: 600;
  font-size: 0.75rem;
}

.time-field-clock {
  width: 28px;
  height: 28px;
  min-height: 28px;
  background: #eef1f6;
  color: #6b7a90;
}

.time-field-popup {
  min-width: 240px;
  padding: 12px 16px;
  border-radius: 16px;
}

.time-field-popup-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.time-spinner-value {
  width: 64px;
  height: 56px;
  border: 1px solid #e4e8f0;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
  color: #5c6b82;
  text-align: center;
  background: transparent;
  outline: none;
}

.time-spinner-value:focus {
  border-color: var(--q-primary);
}

.time-spinner-colon {
  font-size: 1.4rem;
  font-weight: 600;
  color: #9aa6b8;
  padding-bottom: 2px;
}

.time-period-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 8px;
}

.time-period-btn {
  min-width: 56px;
  height: 40px;
  border-radius: 12px;
  font-weight: 700;
}
</style>

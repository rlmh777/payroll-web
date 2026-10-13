<template>
  <div class="leave-type-cards" :class="{ 'leave-type-cards--disabled': disable }">
    <q-inner-loading :showing="loading" />
    <q-card
      v-for="item in items"
      :key="item.leaveTypeId"
      flat
      bordered
      clickable
      class="leave-card"
      :class="[
        `leave-card--${leaveTypeCardTone(item)}`,
        {
          'leave-card--empty': item.affectsBalance && (item.availableDays ?? 0) <= 0,
          'leave-card--selected': modelValue === item.leaveTypeId,
        },
      ]"
      :aria-pressed="modelValue === item.leaveTypeId ? 'true' : 'false'"
      :tabindex="disable ? -1 : 0"
      @click="select(item.leaveTypeId)"
      @keydown.enter.prevent="select(item.leaveTypeId)"
      @keydown.space.prevent="select(item.leaveTypeId)"
    >
      <q-card-section class="leave-card__body">
        <div class="leave-card__name">{{ item.name }}</div>
        <div class="leave-card__available">
          {{ item.affectsBalance && item.availableDays != null ? formatLeaveDays(item.availableDays) : '—' }}
        </div>
        <div class="leave-card__available-label">available</div>
        <div class="leave-card__stat">
          <div class="leave-card__stat-label">Taken</div>
          <div class="leave-card__stat-value">{{ formatLeaveDays(item.takenDays) }}</div>
        </div>
        <div class="leave-card__stat">
          <div class="leave-card__stat-label">Scheduled</div>
          <div class="leave-card__stat-value">{{ formatLeaveDays(item.scheduledDays) }}</div>
        </div>
        <q-badge
          class="q-mt-sm"
          :color="item.isPaid === false ? 'grey-7' : 'positive'"
          :label="item.isPaid === false ? 'Unpaid' : 'Paid'"
        />
      </q-card-section>
    </q-card>
    <div v-if="!loading && items.length === 0" class="text-caption text-grey-6">
      No leave types are available.
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatLeaveDays } from '@hr/components/settings/leave/leave-type-form';
import { leaveTypeCardTone } from '@hr/utils/leave-type-card-tone';

export type LeaveTypeCardItem = {
  leaveTypeId: number;
  name: string;
  code?: string | null;
  isPaid?: boolean;
  affectsBalance: boolean;
  availableDays: number | null;
  takenDays: number;
  scheduledDays: number;
};

const props = withDefaults(
  defineProps<{
    items: LeaveTypeCardItem[];
    disable?: boolean;
    loading?: boolean;
  }>(),
  {
    disable: false,
    loading: false,
  },
);

const modelValue = defineModel<number | null>({ default: null });

const emit = defineEmits<{
  change: [value: number | null];
}>();

function select(leaveTypeId: number) {
  if (props.disable) {
    return;
  }
  const next = modelValue.value === leaveTypeId ? null : leaveTypeId;
  modelValue.value = next;
  emit('change', next);
}
</script>

<style scoped>
.leave-type-cards {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 10px;
  min-height: 48px;
}

.leave-type-cards--disabled {
  pointer-events: none;
  opacity: 0.55;
}

.leave-card {
  border-radius: 10px;
  border-top-width: 4px;
}

.leave-card:hover {
  filter: brightness(0.98);
}

.leave-type-cards:has(.leave-card--selected) .leave-card:not(.leave-card--selected) {
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
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  min-height: 2.6em;
}

.leave-card__available {
  font-size: 22px;
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
</style>

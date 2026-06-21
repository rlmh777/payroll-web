<template>
  <div class="calendar-approvals">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-subtitle1">Approval pending</div>
      <div class="row items-center q-gutter-sm">
        <q-btn
          v-if="items.length"
          dense
          outline
          color="primary"
          label="Approve all"
          @click="emit('approve-all')"
        />
        <q-badge v-if="items.length" color="primary" :label="items.length" />
      </div>
    </div>

    <div v-if="!items.length" class="text-grey-6 q-pa-md">
      No approvals pending.
    </div>

    <q-list v-else bordered separator>
      <q-item v-for="item in items" :key="item.id">
        <q-item-section>
          <q-item-label>{{ item.description }}</q-item-label>
          <q-item-label caption>
            <span class="text-grey-7">{{ itemLabel(item) }}</span>
          </q-item-label>
        </q-item-section>
        <q-item-section side class="items-end">
          <div class="row items-center q-gutter-xs q-mb-xs">
            <q-btn
              dense
              flat
              color="primary"
              icon="check"
              @click="emit('approve', item)"
            />
            <q-btn
              dense
              flat
              color="negative"
              icon="close"
              @click="emit('reject', item)"
            />
          </div>
          <q-badge color="orange" label="Pending" class="q-mb-xs" />
          <q-badge :color="typeColor(item.type)" :label="item.type" />
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

const emit = defineEmits<{
  (event: 'approve', item: ApprovalItem): void;
  (event: 'reject', item: ApprovalItem): void;
  (event: 'approve-all'): void;
}>();

type ApprovalItem = {
  id: string;
  type: 'timesheet' | 'schedule' | 'leave';
  date: string;
  description: string;
  hours_worked: string | number | null;
  approval_status: string;
  employee_id: string;
};

defineProps({
  items: {
    type: Array as PropType<ApprovalItem[]>,
    required: true,
  },
});

function typeColor(type: 'timesheet' | 'schedule' | 'leave') {
  if (type === 'leave') return 'orange';
  if (type === 'schedule') return 'blue-grey';
  return 'blue';
}

function itemLabel(item: ApprovalItem) {
  if (item.type === 'timesheet') {
    return `Hours: ${item.hours_worked ?? '-'} · ${item.date}`;
  }
  return item.date;
}
</script>

<style scoped>
.calendar-approvals {
  padding: 8px;
}
</style>

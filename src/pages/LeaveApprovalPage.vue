<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">Leave Approvals</div>
    <LeaveApprovalList
      :rows="leaveRows"
      @approve="handleApproval($event, 'approved')"
      @reject="handleApproval($event, 'rejected')"
      @refresh="fetchApprovals"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { date, useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import LeaveApprovalList from 'src/components/leave/LeaveApprovalList.vue';
import { useCalendarStore } from 'src/stores/calendar-store';

const $q = useQuasar();
const calendarStore = useCalendarStore();
const { approvalItems, error } = storeToRefs(calendarStore);

const leaveRows = computed(() =>
  approvalItems.value
    .filter((item) => item.type === 'leave')
    .map((item) => ({
      id: item.id,
      employee: item.description.replace(/^(.* - )/, ''),
      date: item.date,
      description: item.description,
      type: item.type,
      status: item.approval_status,
    })),
);

function getMonthRange() {
  const today = new Date();
  const start = date.formatDate(date.startOfDate(today, 'month'), 'YYYY-MM-DD');
  const end = date.formatDate(date.endOfDate(today, 'month'), 'YYYY-MM-DD');
  return { start, end };
}

async function fetchApprovals() {
  const { start, end } = getMonthRange();
  await calendarStore.fetchCalendarApprovals({ start, end });
  if (error.value) {
    $q.notify({ type: 'negative', message: error.value });
  }
}

async function handleApproval(row: { id: string; type: string }, status: 'approved' | 'rejected') {
  try {
    await calendarStore.updateCalendarApproval({ id: row.id, type: 'leave', status });
    $q.notify({ type: 'positive', message: `Leave ${status === 'approved' ? 'approved' : 'rejected'}.` });
    await fetchApprovals();
  } catch (storeError) {
    const message = storeError instanceof Error ? storeError.message : 'Failed to update approval.';
    $q.notify({ type: 'negative', message });
  }
}

onMounted(fetchApprovals);
</script>

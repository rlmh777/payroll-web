<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6">{{ canManage ? 'Employee profile changes' : 'Profile changes' }}</div>
        <div class="text-caption text-grey-7">
          {{
            canManage
              ? 'Review address, phone, and email updates. Add supervisor or extra people in Admin → Settings → Pipelines.'
              : 'Requests waiting for your review or approval.'
          }}
        </div>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1">Waiting on you</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-list v-if="store.inbox.length" bordered separator class="rounded-borders">
          <q-item
            v-for="row in store.inbox"
            :key="row.id"
            clickable
            :to="reviewPath(row.id)"
          >
            <q-item-section>
              <q-item-label>{{ row.employee?.name }}</q-item-label>
              <q-item-label caption>{{ row.pipeline?.currentStep?.label || 'In progress' }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else class="text-grey-7 q-pa-sm">No profile changes are waiting on you.</div>
      </q-card-section>
    </q-card>

    <q-card v-if="canManage" flat bordered>
      <q-card-section>
        <div class="text-subtitle1">All requests</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-table
          flat
          bordered
          dense
          row-key="id"
          :rows="store.items"
          :columns="columns"
          :loading="store.isLoading"
          :no-data-label="store.error || 'No profile changes yet'"
        >
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="statusColor(props.row.status)">{{ props.row.status }}</q-badge>
            </q-td>
          </template>
          <template #body-cell-step="props">
            <q-td :props="props">{{ props.row.pipeline?.currentStep?.label || '—' }}</q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn flat dense color="primary" label="Open" :to="reviewPath(props.row.id)" />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import type { QTableProps } from 'quasar';
import { usePermissions } from '@core/composables/usePermissions';
import { useProfileChangeStore } from '@hr/stores/profile-change-store';

const store = useProfileChangeStore();
const { canAny } = usePermissions();
const route = useRoute();
const canManage = computed(() => canAny(['view-employees', 'employees-crud']));

const columns: QTableProps['columns'] = [
  { name: 'employee', label: 'Employee', field: (row) => row.employee?.name, align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'left' },
  { name: 'step', label: 'Current step', field: 'step', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

function reviewPath(id: string) {
  if (route.path.startsWith('/hr/')) return `/hr/profile-changes/${id}`;
  return `/employee/profile-changes/${id}`;
}

function statusColor(status: string) {
  if (status === 'approved') return 'positive';
  if (status === 'rejected') return 'negative';
  if (status === 'cancelled') return 'grey';
  return 'primary';
}

onMounted(async () => {
  await store.fetchInbox();
  if (canManage.value) {
    try {
      await store.fetchAll();
    } catch {
      // Assignees without directory permission still see the inbox.
    }
  }
});
</script>

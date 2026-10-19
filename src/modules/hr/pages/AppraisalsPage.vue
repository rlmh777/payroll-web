<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="q-mb-md">
      <q-card-section class="row items-center">
        <div class="col">
          <div class="text-h6">{{ canManage ? 'Employee appraisals' : 'Appraisals' }}</div>
          <div class="text-caption text-grey-7">
            {{
              canManage
                ? 'Start reviews and follow the configured pipeline through supervisor, department head, HR, and accounts.'
                : 'Appraisals waiting for your review or approval.'
            }}
          </div>
        </div>
        <q-btn v-if="canStart" color="primary" icon="add" label="Start appraisal" @click="startOpen = true" />
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
              <q-item-label>{{ row.employee?.name }} · {{ row.period_label }}</q-item-label>
              <q-item-label caption>{{ row.pipeline?.currentStep?.label || 'In progress' }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else class="text-grey-7 q-pa-sm">No appraisals are waiting on you.</div>
      </q-card-section>
    </q-card>

    <q-card v-if="canManage" flat bordered>
      <q-card-section>
        <div class="text-subtitle1">All appraisals</div>
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
          :no-data-label="store.error || 'No appraisals yet'"
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

    <StartAppraisalDialog v-model="startOpen" :reports-only="!canManage" @started="onStarted" />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { QTableProps } from 'quasar';
import { usePermissions } from '@core/composables/usePermissions';
import { useAppraisalStore } from '@hr/stores/appraisal-store';
import StartAppraisalDialog from '@hr/components/appraisals/StartAppraisalDialog.vue';

const store = useAppraisalStore();
const { canAny } = usePermissions();
const route = useRoute();
const router = useRouter();
const startOpen = ref(false);
const canManage = computed(() => canAny(['appraisals-crud', 'employees-crud']));
const canStart = computed(() => canManage.value || !route.path.startsWith('/hr/'));

const columns: QTableProps['columns'] = [
  { name: 'employee', label: 'Employee', field: (row) => row.employee?.name, align: 'left' },
  { name: 'period', label: 'Period', field: 'period_label', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'left' },
  { name: 'step', label: 'Current step', field: 'step', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

function reviewPath(id: string) {
  return route.path.startsWith('/hr/') ? `/hr/appraisals/${id}` : `/appraisals/${id}`;
}

function statusColor(status: string) {
  if (status === 'approved') return 'positive';
  if (status === 'rejected') return 'negative';
  if (status === 'cancelled') return 'grey';
  return 'primary';
}

async function onStarted(id: string) {
  await Promise.all([store.fetchInbox(), canManage.value ? store.fetchAll() : Promise.resolve()]);
  await router.push(reviewPath(id));
}

onMounted(async () => {
  await store.fetchInbox();
  if (canManage.value) {
    try {
      await store.fetchAll();
    } catch {
      // Inbox still loads for assignees without the HR list permission.
    }
  }
});
</script>

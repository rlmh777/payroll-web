<template>
  <div class="row q-gutter-md items-start">
    <!-- Left side: Pay Period Group Cards -->
    <div class="col-auto mt-2" style="max-width: 300px;">
      <q-scroll-area style="height: calc(100vh - 200px); width: 300px; margin-top: 30px;">
        <div class="q-gutter-sm">
          <q-card
            v-for="group in rows"
            :key="group.id"
            :class="['group-card', { 'selected': selectedGroup?.id === group.id }]"
            @click="selectGroup(group)"
            clickable
          >
            <q-card-section class="q-pa-sm">
              <div class="row items-center q-mb-xs">
                <div class="col">
                  <div class="text-subtitle2 text-weight-medium">{{ group.name }}</div>
                </div>
                <q-icon
                  v-if="group.isDefault"
                  name="star"
                  color="primary"
                  size="sm"
                  class="q-ml-xs"
                />
              </div>
              <q-badge
                :color="group.status === 'active' ? 'positive' : 'grey'"
                :label="group.status"
                class="q-mt-xs"
              />
            </q-card-section>
            <q-card-actions align="right" class="q-pa-xs">
              <q-btn
                flat
                round
                dense
                icon="edit"
                color="primary"
                size="sm"
                @click.stop="openEditDialog(group)"
              >
                <q-tooltip>Edit Group</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                icon="delete"
                color="negative"
                size="sm"
                @click.stop="confirmDelete(group)"
              >
                <q-tooltip>Delete Group</q-tooltip>
              </q-btn>
            </q-card-actions>
          </q-card>
        </div>
      </q-scroll-area>
    </div>

    <!-- Vertical Separator -->
    <q-separator vertical inset class="separator-column" />

    <!-- Right side: Pay Period Schedules Table -->
    <div class="col" style="margin-top: 50px;">
      <div v-if="selectedGroup">
        <div class="row items-center q-mb-md">
          <div class="text-h6">{{ selectedGroup.name }} - Pay Period Schedules</div>
          <q-space />
          <q-btn
            color="primary"
            label="Add Schedule"
            icon="add"
            @click="showAddScheduleDialog = true"
          />
        </div>
        <ViewPayPeriodSchedules
          :pay-period-group-id="selectedGroup.id"
          @edit="openEditScheduleDialog"
        />
      </div>
      <div v-else class="text-center text-grey-6 q-pa-lg">
        Select a pay period group to view its schedules
      </div>
    </div>

    <!-- Edit Pay Period Group Dialog -->
    <EditPayPeriodGroup
      v-model="showEditDialog"
      :record="selectedRecord"
      @updated="onRecordUpdated"
    />

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6">Confirm Delete</span>
        </q-card-section>

        <q-card-section>
          <span>Are you sure you want to delete this pay period group? This action cannot be undone.</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="handleDelete" :loading="payPeriodGroupStore.isLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { usePayPeriodGroupStore, type PayPeriodGroup } from '../../../stores/pay-period-group-store';
import EditPayPeriodGroup from './EditPayPeriodGroup.vue';
import ViewPayPeriodSchedules from '../pay-period-schedules/ViewPayPeriodSchedules.vue';
import type { PayPeriodSchedule } from '../../../stores/pay-period-schedule-store';

const $q = useQuasar();
const payPeriodGroupStore = usePayPeriodGroupStore();

// Watch for search filter changes and refetch (reset to page 1)
watch(
  () => payPeriodGroupStore.searchFilters,
  async () => {
    payPeriodGroupStore.currentPage = 1;
    await payPeriodGroupStore.fetchPayPeriodGroups(1, 100); // Fetch more for card view
  },
  { deep: true }
);

const rows = computed(() => payPeriodGroupStore.payPeriodGroups);
const selectedGroup = ref<PayPeriodGroup | null>(null);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const showAddScheduleDialog = ref(false);
const selectedRecord = ref<PayPeriodGroup | null>(null);
const recordToDelete = ref<PayPeriodGroup | null>(null);

const selectGroup = (group: PayPeriodGroup) => {
  selectedGroup.value = group;
};

const openEditDialog = (record: PayPeriodGroup) => {
  selectedRecord.value = record;
  showEditDialog.value = true;
};

const onRecordUpdated = async () => {
  // Refresh the list after a record is updated
  await payPeriodGroupStore.fetchPayPeriodGroups(1, 100);
  // If the updated group is selected, refresh it
  if (selectedRecord.value) {
    const updatedGroup = payPeriodGroupStore.payPeriodGroups.find(g => g.id === selectedRecord.value?.id);
    if (updatedGroup) {
      selectedGroup.value = updatedGroup;
    }
  }
};

const confirmDelete = (record: PayPeriodGroup) => {
  recordToDelete.value = record;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!recordToDelete.value) return;

  const deletedId = recordToDelete.value.id;
  const success = await payPeriodGroupStore.deletePayPeriodGroup(deletedId);
  if (success) {
    $q.notify({
      type: 'positive',
      message: 'Pay period group deleted successfully',
      position: 'top',
    });
    showDeleteDialog.value = false;
    
    // Clear selection if deleted group was selected
    if (selectedGroup.value?.id === deletedId) {
      selectedGroup.value = null;
    }
    
    recordToDelete.value = null;
    
    // Refresh the list
    await payPeriodGroupStore.fetchPayPeriodGroups(1, 100);
  } else {
    $q.notify({
      type: 'negative',
      message: payPeriodGroupStore.error || 'Failed to delete pay period group',
      position: 'top',
    });
  }
};

const openEditScheduleDialog = (_schedule: PayPeriodSchedule) => {
  console.log('openEditScheduleDialog', _schedule);
  // TODO: Implement edit schedule dialog
  $q.notify({
    type: 'info',
    message: 'Edit schedule functionality coming soon',
    position: 'top',
  });
};

onMounted(async () => {
  // Fetch records with current search filters
  await payPeriodGroupStore.fetchPayPeriodGroups(1, 100);
});
</script>

<style scoped>
.group-card {
  max-width: 300px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.group-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.group-card.selected {
  border: 2px solid var(--q-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.separator-column {
  height: calc(100vh - 200px);
  margin-top: 50px;
  align-self: flex-start;
}

</style>

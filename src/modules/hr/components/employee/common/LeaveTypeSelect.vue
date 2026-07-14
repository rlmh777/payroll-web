<template>
  <div>
    <q-select
      v-model="selectedLeaveTypeId"
      :options="options"
      option-value="id"
      option-label="name"
      use-input
      fill-input
      hide-selected
      emit-value
      map-options
      clearable
      outlined
      dense
      input-debounce="0"
      :readonly="readonly"
      label="Leave Type"
      :loading="employeeStore.isLoadingLeaveTypes"
      @filter="filterLeaveTypes"
    >
      <template v-if="employeeStore.isLoadingLeaveTypes" v-slot:prepend>
        <q-spinner color="primary" size="20px" />
      </template>
      <template v-slot:option="scope">
        <q-item
          v-if="scope.opt.id === 'add-new'"
          clickable
          v-close-popup
          @click="openAddLeaveTypeDialog"
        >
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add New Leave Type</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name }}</q-item-label>
            <q-item-label v-if="scope.opt.id !== 'add-new'" caption>
              {{ scope.opt.isPaid === false ? 'Unpaid leave' : 'Paid leave' }}
            </q-item-label>
          </q-item-section>
          <q-item-section v-if="scope.opt.id !== 'add-new'" side>
            <q-badge
              :color="scope.opt.isPaid === false ? 'grey-7' : 'positive'"
              :label="scope.opt.isPaid === false ? 'Unpaid' : 'Paid'"
            />
          </q-item-section>
          <q-item-section v-if="showEdit && !readonly && scope.opt.id !== 'add-new'" side>
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              size="sm"
              @click.stop="openEditLeaveTypeDialog(scope.opt as LeaveType)"
            >
              <q-tooltip>Edit Leave Type</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
    <AddLeaveType
      v-model="showAddDialog"
      @saved="onLeaveTypeSaved"
    />
    <EditLeaveType
      v-model="showEditDialog"
      :leaveType="selectedLeaveType"
      @updated="onLeaveTypeUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useEmployeeStore } from '@/stores/employee-store';
import AddLeaveType from '../../leave-type/AddLeaveType.vue';
import EditLeaveType from '../../leave-type/EditLeaveType.vue';
import type { LeaveType } from '@core/types/models';

interface Props {
  modelValue?: number | null;
  readonly?: boolean;
  employeeLeaveType?: number | null;
  showAddNew?: boolean;
  showEdit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  employeeLeaveType: null as number | null,
  showAddNew: false,
  showEdit: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
  'change': [value: number | null];
}>();

const employeeStore = useEmployeeStore();

const showAddDialog = ref(false);
const showEditDialog = ref(false);
const selectedLeaveType = ref<LeaveType | null>(null);
const filterText = ref('');

const options = computed(() => {
  const needle = filterText.value.trim().toLowerCase();
  const filtered = needle
    ? employeeStore.leaveTypes.filter((leaveType) =>
        (leaveType.name || '').toLowerCase().includes(needle),
      )
    : [...employeeStore.leaveTypes];
  const list: (LeaveType | { id: string; name: string })[] = filtered;
  if (props.showAddNew && !props.readonly) {
    list.unshift({ id: 'add-new', name: 'Add New Leave Type' });
  }
  return list;
});

const filterLeaveTypes = (val: string, update: (callback: () => void) => void) => {
  update(() => {
    filterText.value = val || '';
  });
};

const selectedLeaveTypeId = computed({
  get: (): number | null => {
    return props.modelValue;
  },
  set: (value: number | null | string) => {
    if (value === 'add-new') {
      openAddLeaveTypeDialog();
      return;
    }
    emit('update:modelValue', value as number | null);
    emit('change', value as number | null);
  },
});

const openAddLeaveTypeDialog = () => {
  showAddDialog.value = true;
};

const openEditLeaveTypeDialog = (leaveType: LeaveType) => {
  selectedLeaveType.value = leaveType;
  showEditDialog.value = true;
};

const onLeaveTypeSaved = async (leaveTypeId: string) => {
  await employeeStore.fetchLeaveTypes('');
  await nextTick();
  const id = parseInt(leaveTypeId, 10);
  if (!isNaN(id)) {
    await nextTick();
    emit('update:modelValue', id);
    emit('change', id);
  }
};

const onLeaveTypeUpdated = async () => {
  await employeeStore.fetchLeaveTypes('');
};

onMounted(async () => {
  if (employeeStore.leaveTypes.length === 0) {
    await employeeStore.fetchLeaveTypes();
  }
});
</script>

<style scoped>
</style>


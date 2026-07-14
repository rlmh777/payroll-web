<template>
  <div>
    <q-select
      v-model="selectedId"
      :options="options"
      option-value="id"
      option-label="name"
      emit-value
      map-options
      use-input
      fill-input
      hide-selected
      input-debounce="300"
      outlined
      dense
      :clearable="clearable"
      :label="label"
      :disable="disable"
      :loading="store.isLoadingPayPeriodGroups"
      @filter="filterOptions"
    >
      <template v-if="store.isLoadingPayPeriodGroups" #prepend>
        <q-spinner color="primary" size="20px" />
      </template>
      <template #option="scope">
        <q-item
          v-if="scope.opt.id === 'add-new'"
          clickable
          v-close-popup
          @click="openAddDialog"
        >
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add New Pay Period Group</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name }}</q-item-label>
            <q-item-label v-if="scope.opt.status" caption class="text-grey-6">
              {{ scope.opt.status }}
            </q-item-label>
          </q-item-section>
          <q-item-section v-if="showEdit && !disable" side>
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              size="sm"
              @click.stop="openEditDialog(scope.opt as PayPeriodGroup)"
            >
              <q-tooltip>Edit Pay Period Group</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <AddPayPeriodGroup v-model="showAddDialog" @saved="onSaved" />
    <EditPayPeriodGroup
      v-model="showEditDialog"
      :record="selectedItem"
      @updated="onUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { usePayPeriodGroupStore, type PayPeriodGroup } from '@payroll/stores/pay-period-group-store';
import AddPayPeriodGroup from './AddPayPeriodGroup.vue';
import EditPayPeriodGroup from './EditPayPeriodGroup.vue';

const props = withDefaults(defineProps<{
  modelValue?: string | null;
  label?: string;
  disable?: boolean;
  showAddNew?: boolean;
  showEdit?: boolean;
  clearable?: boolean;
}>(), {
  modelValue: null,
  label: 'Default pay period group',
  disable: false,
  showAddNew: true,
  showEdit: true,
  clearable: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
}>();

const store = usePayPeriodGroupStore();
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const selectedItem = ref<PayPeriodGroup | null>(null);
const options = ref<(PayPeriodGroup | { id: string; name: string })[]>([]);

const buildOptions = (items: PayPeriodGroup[]) => {
  const list: (PayPeriodGroup | { id: string; name: string })[] = [...items];
  if (props.showAddNew && !props.disable) {
    list.unshift({ id: 'add-new', name: 'Add New Pay Period Group' });
  }
  return list;
};

const selectedId = computed({
  get: () => props.modelValue ?? null,
  set: (value: string | null) => {
    if (value === 'add-new') {
      openAddDialog();
      return;
    }
    emit('update:modelValue', value);
  },
});

function filterOptions(val: string, update: (fn: () => void) => void) {
  update(() => {
    const search = val?.trim().toLowerCase() ?? '';
    const filtered = search
      ? store.payPeriodGroups.filter((item) => item.name.toLowerCase().includes(search))
      : store.payPeriodGroups;
    options.value = buildOptions(filtered);
  });
}

function openAddDialog() {
  showAddDialog.value = true;
}

function openEditDialog(item: PayPeriodGroup) {
  selectedItem.value = item;
  showEditDialog.value = true;
}

async function onSaved(id: string) {
  await store.fetchPayPeriodGroups(1, 100);
  await nextTick();
  options.value = buildOptions(store.payPeriodGroups);
  emit('update:modelValue', id);
}

async function onUpdated() {
  await store.fetchPayPeriodGroups(1, 100);
  options.value = buildOptions(store.payPeriodGroups);
}

onMounted(async () => {
  if (store.payPeriodGroups.length === 0) {
    await store.fetchPayPeriodGroups(1, 100);
  }
  options.value = buildOptions(store.payPeriodGroups);
});
</script>

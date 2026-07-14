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
      :label="label"
      :disable="disable"
      :loading="store.isLoadingContractTypes"
      @filter="filterOptions"
    >
      <template v-if="store.isLoadingContractTypes" #prepend>
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
            <q-item-label>Add New Contract Type</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name }}</q-item-label>
          </q-item-section>
          <q-item-section v-if="showEdit && !disable" side>
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              size="sm"
              @click.stop="openEditDialog(scope.opt as ContractType)"
            >
              <q-tooltip>Edit Contract Type</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <AddContractType v-model="showAddDialog" @saved="onSaved" />
    <EditContractType
      v-model="showEditDialog"
      :contract-type="selectedItem"
      @updated="onUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useContractTypeStore, type ContractType } from 'src/stores/contract-type-store';
import AddContractType from './AddContractType.vue';
import EditContractType from './EditContractType.vue';

const props = withDefaults(defineProps<{
  modelValue?: number | null;
  label?: string;
  disable?: boolean;
  showAddNew?: boolean;
  showEdit?: boolean;
}>(), {
  modelValue: null,
  label: 'Contract Type',
  disable: false,
  showAddNew: true,
  showEdit: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
}>();

const store = useContractTypeStore();
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const selectedItem = ref<ContractType | null>(null);
const options = ref<(ContractType | { id: number | string; name: string })[]>([]);

const buildOptions = (items: ContractType[]) => {
  const list: (ContractType | { id: number | string; name: string })[] = [...items];
  if (props.showAddNew && !props.disable) {
    list.unshift({ id: 'add-new', name: 'Add New Contract Type' });
  }
  return list;
};

const selectedId = computed({
  get: () => props.modelValue ?? null,
  set: (value: number | string | null) => {
    if (value === 'add-new') {
      openAddDialog();
      return;
    }
    emit('update:modelValue', typeof value === 'number' ? value : null);
  },
});

function filterOptions(val: string, update: (fn: () => void) => void) {
  update(() => {
    const search = val?.trim().toLowerCase() ?? '';
    const filtered = search
      ? store.contractTypes.filter((item) => item.name.toLowerCase().includes(search))
      : store.contractTypes;
    options.value = buildOptions(filtered);
  });
}

function openAddDialog() {
  showAddDialog.value = true;
}

function openEditDialog(item: ContractType) {
  selectedItem.value = item;
  showEditDialog.value = true;
}

async function onSaved(id: number) {
  await store.fetchContractTypes();
  await nextTick();
  options.value = buildOptions(store.contractTypes);
  emit('update:modelValue', id);
}

async function onUpdated() {
  await store.fetchContractTypes();
  options.value = buildOptions(store.contractTypes);
}

onMounted(async () => {
  if (store.contractTypes.length === 0) {
    await store.fetchContractTypes();
  }
  options.value = buildOptions(store.contractTypes);
});
</script>

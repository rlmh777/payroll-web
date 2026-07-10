<template>
  <div>
    <q-select
      v-model="selectedBenefitTypeId"
      :options="benefitTypeOptions"
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
      clearable
      :label="label"
      :disable="disable"
      :loading="store.isLoadingBenefitTypes"
      @filter="filterBenefitTypes"
    >
      <template v-if="store.isLoadingBenefitTypes" #prepend>
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
            <q-item-label>Add New Benefit Type</q-item-label>
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
              @click.stop="openEditDialog(scope.opt as SsBenefitType)"
            >
              <q-tooltip>Edit Benefit Type</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <AddSsBenefitType v-model="showAddDialog" @saved="onBenefitTypeSaved" />
    <EditSsBenefitType
      v-model="showEditDialog"
      :benefit-type="selectedBenefitType"
      @updated="onBenefitTypeUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useSsBenefitTypeStore, type SsBenefitType } from 'src/stores/ss-benefit-type-store';
import AddSsBenefitType from './AddSsBenefitType.vue';
import EditSsBenefitType from './EditSsBenefitType.vue';

const props = withDefaults(defineProps<{
  modelValue?: number | null;
  label?: string;
  disable?: boolean;
  showAddNew?: boolean;
  showEdit?: boolean;
}>(), {
  modelValue: null,
  label: 'Benefit Type',
  disable: false,
  showAddNew: true,
  showEdit: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
}>();

const store = useSsBenefitTypeStore();
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const selectedBenefitType = ref<SsBenefitType | null>(null);

type BenefitTypeOption = SsBenefitType | { id: 'add-new'; name: string };

const benefitTypeOptions = computed((): BenefitTypeOption[] => {
  const options: BenefitTypeOption[] = [...store.benefitTypes];
  if (props.showAddNew && !props.disable) {
    options.unshift({ id: 'add-new', name: 'Add New Benefit Type' });
  }
  return options;
});

const selectedBenefitTypeId = computed({
  get: (): number | null => props.modelValue,
  set: (value: number | null | string) => {
    if (value === 'add-new') {
      openAddDialog();
      return;
    }
    emit('update:modelValue', value as number | null);
  },
});

function filterBenefitTypes(val: string, update: (callback: () => void) => void) {
  update(() => undefined);
  void store.fetchBenefitTypes(val || undefined);
}

function openAddDialog() {
  showAddDialog.value = true;
}

function openEditDialog(type: SsBenefitType) {
  selectedBenefitType.value = type;
  showEditDialog.value = true;
}

async function onBenefitTypeSaved(benefitTypeId: number) {
  await store.fetchBenefitTypes();
  await nextTick();
  emit('update:modelValue', benefitTypeId);
}

async function onBenefitTypeUpdated() {
  await store.fetchBenefitTypes();
}

onMounted(async () => {
  if (store.benefitTypes.length === 0) {
    await store.fetchBenefitTypes();
  }
});
</script>

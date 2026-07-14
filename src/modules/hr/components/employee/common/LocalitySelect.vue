<template>
  <div>
    <q-select
      v-model="selectedLocalityId"
      :options="options"
      option-value="id"
      option-label="name"
      use-input
      fill-input
      hide-selected
      emit-value
      map-options
      input-debounce="300"
      :readonly="readonly"
      label="Locality"
      :loading="isInitialLoading"
      @filter="filterLocalities"
      @filter-abort="onFilterAbort"
    >
      <template v-slot:option="scope">
        <q-item
          v-if="scope.opt.id === 'add-new'"
          clickable
          v-close-popup
          @click="openAddLocalityDialog"
        >
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add New Location</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name }}</q-item-label>
            <q-item-label
              v-if="scope.opt.district?.name || scope.opt.district?.country?.name"
              caption
              class="text-grey-6"
            >
              <span v-if="scope.opt.district?.name">─ {{ scope.opt.district.name }}</span>
              <span v-if="scope.opt.district?.name && scope.opt.district?.country?.name"> • </span>
              <span v-if="scope.opt.district?.country?.name">{{ scope.opt.district.country.name }}</span>
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
    <AddLocality
      v-model="showAddDialog"
      @saved="onLocalitySaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useEmployeeStore } from '@/stores/employee-store';
import { useCrudPermission } from '@core/composables/useCrudPermission';
import type { Locality } from '@core/types/models';
import AddLocality from '@core/components/shared/locality/AddLocality.vue';

interface Props {
  modelValue?: string | null;
  readonly?: boolean;
  employeeLocality?: string | null;
  showAddNew?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  employeeLocality: null,
  showAddNew: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  'change': [value: string | null];
}>();

const employeeStore = useEmployeeStore();
const { withCrudFlags } = useCrudPermission('locality');
const crudFlags = withCrudFlags(props);
const options = ref<(Locality | { id: string; name: string })[]>([]);
const cachedLocalities = ref<Locality[]>([]);
const isInitialLoading = ref(false);
const filterTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const filterGeneration = ref(0);
const showAddDialog = ref(false);

function withSelected(items: Locality[]): Locality[] {
  const source = [...items];
  const selectedLocality = employeeStore.selectedEmployee?.locality;

  if (
    props.modelValue &&
    selectedLocality?.id === props.modelValue &&
    !source.some((locality) => locality.id === props.modelValue)
  ) {
    source.unshift(selectedLocality);
  }

  return source;
}

function buildOptions(items: Locality[]) {
  const list: (Locality | { id: string; name: string })[] = [...withSelected(items)];
  if (crudFlags.showAddNew.value && !props.readonly) {
    list.unshift({ id: 'add-new', name: 'Add New Location' });
  }
  return list;
}

function onFilterAbort() {
  filterGeneration.value += 1;
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
    filterTimeout.value = null;
  }
}

/**
 * Quasar only displays filtered options when update() is called for the active
 * filter ticket. Call update() exactly once when results are ready.
 * input-debounce already debounces typing, so fetch immediately here.
 */
const filterLocalities = (
  val: string,
  update: (callback: () => void) => void,
) => {
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
    filterTimeout.value = null;
  }

  const search = (val || '').trim();
  const generation = ++filterGeneration.value;

  if (!search) {
    update(() => {
      options.value = buildOptions(cachedLocalities.value);
    });
    return;
  }

  void (async () => {
    const results = await employeeStore.fetchLocalities(search, { silent: true });
    if (generation !== filterGeneration.value) {
      return;
    }
    update(() => {
      options.value = buildOptions(results ?? []);
    });
  })();
};

const selectedLocalityId = computed({
  get: (): string | null => props.modelValue || null,
  set: (value: string | null) => {
    if (value === 'add-new') {
      openAddLocalityDialog();
      return;
    }
    emit('update:modelValue', value);
    emit('change', value);
  },
});

const openAddLocalityDialog = () => {
  showAddDialog.value = true;
};

const onLocalitySaved = async (localityId: string) => {
  const results = await employeeStore.fetchLocalities('');
  cachedLocalities.value = [...(results ?? [])];
  options.value = buildOptions(cachedLocalities.value);
  emit('update:modelValue', localityId);
  emit('change', localityId);
};

onMounted(async () => {
  isInitialLoading.value = true;
  try {
    if (employeeStore.localities.length === 0) {
      await employeeStore.fetchLocalities('');
    }
    cachedLocalities.value = [...employeeStore.localities];
    options.value = buildOptions(cachedLocalities.value);
  } finally {
    isInitialLoading.value = false;
  }
});

onUnmounted(() => {
  onFilterAbort();
});
</script>

<template>
  <div>
    <q-select
      v-model="selectedEmployeeId"
      :options="filteredOptions"
      option-value="id"
      option-label="displayName"
      use-input
      fill-input
      hide-selected
      emit-value
      map-options
      input-debounce="300"
      :readonly="readonly"
      :disable="disable"
      :rules="rules"
      :clearable="clearable"
      :label="label"
      :loading="isLoading"
      @filter="filterEmployees"
    >
      <template v-if="isLoading" v-slot:prepend>
        <q-spinner color="primary" size="20px" />
      </template>
      <template v-slot:option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.displayName }}</q-item-label>
            <q-item-label v-if="scope.opt.code" caption class="text-grey-6">
              ─ Code: {{ scope.opt.code }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useEmployeeStore } from '../../stores/employee-store';
import type { Employee } from '@core/types/models';

interface Props {
  modelValue?: string | null;
  readonly?: boolean;
  disable?: boolean;
  rules?: Array<(val: string | null | undefined) => boolean | string>;
  clearable?: boolean;
  label?: string;
  excludeEmployeeId?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  disable: false,
  rules: () => [],
  clearable: false,
  label: 'Employee',
  excludeEmployeeId: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  'change': [value: string | null];
}>();

const employeeStore = useEmployeeStore();
const filterTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const isLoading = ref(false);
const filterText = ref('');

type EmployeeOption = {
  id: string;
  displayName: string;
  code?: string;
};

const allOptions = computed((): EmployeeOption[] => {
  return employeeStore.employees
    .filter((emp: Employee) => {
      if (!props.excludeEmployeeId) {
        return true;
      }
      return String(emp.id) !== String(props.excludeEmployeeId);
    })
    .map((emp: Employee) => ({
      id: emp.id,
      displayName: `${emp.firstName} ${emp.lastName}`,
      code: emp.code,
    }));
});

const filteredOptions = computed(() => {
  const needle = filterText.value.trim().toLowerCase();
  if (!needle) {
    return allOptions.value;
  }

  return allOptions.value.filter((opt) => {
    return opt.displayName.toLowerCase().includes(needle)
      || (opt.code ?? '').toLowerCase().includes(needle);
  });
});

const filterEmployees = (val: string, update: (callback: () => void) => void) => {
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }

  filterText.value = val || '';

  if (!val || val.trim() === '') {
    update(() => {});
    return;
  }

  update(() => {});

  filterTimeout.value = setTimeout(() => {
    void (async () => {
      isLoading.value = true;
      employeeStore.searchName = val;
      await employeeStore.fetchEmployees(true);
      isLoading.value = false;
      update(() => {});
    })();
  }, 300);
};

const selectedEmployeeId = computed({
  get: (): string | null => {
    return props.modelValue || null;
  },
  set: (value: string | null) => {
    emit('update:modelValue', value);
    emit('change', value);
  },
});

onMounted(async () => {
  if (employeeStore.employees.length === 0) {
    isLoading.value = true;
    await employeeStore.fetchEmployees(true);
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }
});
</script>

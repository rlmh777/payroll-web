<template>
  <q-dialog v-model="dialogModel">
    <q-card style="min-width: 420px">
      <q-card-section>
        <div class="text-h6">Copy schedule</div>
        <div class="text-caption text-grey-7 q-mt-xs">
          Copy {{ scopeModel === 'series' ? 'the entire series' : 'this event' }} to other employees.
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-option-group
          v-model="scopeModel"
          :options="scopeOptions"
          color="primary"
          dense
          class="q-mb-md"
        />

        <q-select
          v-model="selectedEmployeeIds"
          :options="filteredEmployeeOptions"
          option-value="id"
          :option-label="employeeOptionLabel"
          emit-value
          map-options
          multiple
          use-chips
          use-input
          input-debounce="0"
          outlined
          dense
          label="Employees"
          @filter="filterEmployees"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="grey" v-close-popup />
        <q-btn
          color="primary"
          label="Copy"
          :disable="!selectedEmployeeIds.length"
          @click="emit('copy', { employeeIds: selectedEmployeeIds, scope: scopeModel })"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { rankFuzzyMatches } from 'src/utils/fuzzy-search';

type EmployeeOption = {
  id: string;
  firstName: string;
  lastName: string;
  code?: string;
};

const props = defineProps<{
  modelValue: boolean;
  employees: EmployeeOption[];
  sourceEmployeeId?: string | null;
  hasSeries?: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'copy', payload: { employeeIds: string[]; scope: 'single' | 'series' }): void;
}>();

const selectedEmployeeIds = ref<string[]>([]);
const scopeModel = ref<'single' | 'series'>('single');

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const scopeOptions = computed(() => {
  if (props.hasSeries) {
    return [
      { label: 'This event only', value: 'single' },
      { label: 'Entire series', value: 'series' },
    ];
  }

  return [{ label: 'This event', value: 'single' }];
});

const employeeOptions = computed(() =>
  props.employees.filter((employee) => employee.id !== props.sourceEmployeeId),
);

const filteredEmployeeOptions = ref<EmployeeOption[]>([]);

const employeeOptionLabel = (employee: EmployeeOption) => {
  const name = `${employee.firstName} ${employee.lastName}`.trim();
  return employee.code ? `${name} · ${employee.code}` : name;
};

function resetEmployeeOptions() {
  filteredEmployeeOptions.value = [...employeeOptions.value];
}

function filterEmployees(val: string, update: (callback: () => void) => void) {
  update(() => {
    filteredEmployeeOptions.value = rankFuzzyMatches(
      employeeOptions.value,
      val,
      (employee) => [
        employee.firstName,
        employee.lastName,
        employee.code,
        `${employee.firstName} ${employee.lastName}`.trim(),
      ],
    );
  });
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      selectedEmployeeIds.value = [];
      scopeModel.value = 'single';
      resetEmployeeOptions();
    }
  },
);

watch(employeeOptions, () => {
  if (props.modelValue) {
    resetEmployeeOptions();
  }
});
</script>

<template>
  <q-form class="q-gutter-md" @submit.prevent="$emit('submit')">
    <q-input v-model="model.code" label="Code *" dense outlined :disable="saving" />
    <q-input v-model="model.name" label="Name *" dense outlined :disable="saving" />
    <q-input v-model="model.description" type="textarea" label="Description" dense outlined :disable="saving" />
    <q-input v-model.number="model.priority" type="number" label="Priority" dense outlined :disable="saving" />

    <q-select
      v-model="model.employee_contribution_method"
      :options="methodOptions"
      label="Employee Method"
      dense
      outlined
      emit-value
      map-options
      :disable="saving"
    />
    <q-input
      v-if="model.employee_contribution_method === 'FIXED_WEEKLY'"
      v-model.number="model.employee_fixed_weekly_amount"
      type="number"
      step="0.01"
      label="Employee Fixed Weekly"
      dense
      outlined
      :disable="saving"
    />
    <q-input
      v-if="model.employee_contribution_method === 'RATE'"
      v-model.number="model.employee_rate"
      type="number"
      step="0.01"
      label="Employee Rate %"
      dense
      outlined
      :disable="saving"
    />

    <q-select
      v-model="model.employer_contribution_method"
      :options="methodOptions"
      label="Employer Method"
      dense
      outlined
      emit-value
      map-options
      :disable="saving"
    />
    <q-input
      v-if="model.employer_contribution_method === 'FIXED_WEEKLY'"
      v-model.number="model.employer_fixed_weekly_amount"
      type="number"
      step="0.01"
      label="Employer Fixed Weekly"
      dense
      outlined
      :disable="saving"
    />
    <q-input
      v-if="model.employer_contribution_method === 'RATE'"
      v-model.number="model.employer_rate"
      type="number"
      step="0.01"
      label="Employer Rate %"
      dense
      outlined
      :disable="saving"
    />

    <q-toggle v-model="model.skip_tier_lookup" label="Skip tier table lookup" :disable="saving" />

    <q-input
      v-model="model.conditionsJson"
      type="textarea"
      label="Conditions (JSON)"
      rows="8"
      dense
      outlined
      :disable="saving"
    />

    <q-select
      v-model="model.state"
      :options="stateOptions"
      label="State"
      dense
      outlined
      emit-value
      map-options
      :disable="saving"
    />

    <div class="row justify-end q-gutter-sm">
      <q-btn flat label="Cancel" color="grey" :disable="saving" @click="$emit('cancel')" />
      <q-btn type="submit" color="primary" :loading="saving" label="Save" />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import type { ContributionRuleFormModel } from 'src/stores/ss-contribution-rule-store';

defineProps<{ saving: boolean }>();
defineEmits<{ submit: []; cancel: [] }>();

const model = defineModel<ContributionRuleFormModel>({ required: true });

const methodOptions = [
  { label: 'None', value: 'NONE' },
  { label: 'Tier Table', value: 'TIER_TABLE' },
  { label: 'Fixed Weekly', value: 'FIXED_WEEKLY' },
  { label: 'Rate %', value: 'RATE' },
];

const stateOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];
</script>

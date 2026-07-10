<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Contribution Rule</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="closeDialog" />
      </q-card-section>
      <q-card-section v-if="form">
        <ContributionRuleForm v-model="form" :saving="saving" @submit="save" @cancel="closeDialog" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import {
  useSsContributionRuleStore,
  type ContributionRuleFormModel,
} from 'src/stores/ss-contribution-rule-store';
import ContributionRuleForm from './ContributionRuleForm.vue';

const $q = useQuasar();
const store = useSsContributionRuleStore();
const saving = ref(false);
const form = ref<ContributionRuleFormModel | null>(null);

const isOpen = computed({
  get: () => !!store.ruleToEdit,
  set: (v) => { if (!v) store.setRuleToEdit(null); },
});

watch(() => store.ruleToEdit, (rule) => {
  if (!rule) {
    form.value = null;
    return;
  }
  form.value = {
    code: rule.code,
    name: rule.name,
    description: rule.description ?? '',
    priority: rule.priority,
    employee_contribution_method: rule.employee_contribution_method,
    employer_contribution_method: rule.employer_contribution_method,
    employee_fixed_weekly_amount: rule.employee_fixed_weekly_amount ?? null,
    employer_fixed_weekly_amount: rule.employer_fixed_weekly_amount ?? null,
    employee_rate: rule.employee_rate ?? null,
    employer_rate: rule.employer_rate ?? null,
    skip_tier_lookup: rule.skip_tier_lookup,
    conditionsJson: JSON.stringify(rule.conditions, null, 2),
    state: rule.state,
    id: rule.id,
  };
}, { immediate: true });

function closeDialog() {
  store.setRuleToEdit(null);
}

async function save() {
  if (!form.value || !store.ruleToEdit) return;
  saving.value = true;
  try {
    const conditions = JSON.parse(form.value.conditionsJson) as Record<string, unknown>;
    await store.updateRule(store.ruleToEdit.id, {
      code: form.value.code.trim().toUpperCase(),
      name: form.value.name.trim(),
      description: form.value.description || null,
      priority: form.value.priority,
      employee_contribution_method: form.value.employee_contribution_method,
      employer_contribution_method: form.value.employer_contribution_method,
      employee_fixed_weekly_amount: form.value.employee_fixed_weekly_amount,
      employer_fixed_weekly_amount: form.value.employer_fixed_weekly_amount,
      employee_rate: form.value.employee_rate,
      employer_rate: form.value.employer_rate,
      skip_tier_lookup: form.value.skip_tier_lookup,
      conditions,
      state: form.value.state,
    });
    $q.notify({ color: 'positive', position: 'top', message: 'Rule updated.' });
    closeDialog();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error instanceof Error ? error.message : 'Failed to update rule.',
    });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.drawer-card {
  width: 32vw;
  max-width: 480px;
  height: 100vh;
}
</style>

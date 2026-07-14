<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">New Contribution Rule</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="closeDialog" />
      </q-card-section>
      <q-card-section>
        <ContributionRuleForm v-model="form" :saving="saving" @submit="save" @cancel="closeDialog" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import {
  useSsContributionRuleStore,
  type ContributionRuleFormModel,
} from 'src/stores/ss-contribution-rule-store';
import ContributionRuleForm from './ContributionRuleForm.vue';

const $q = useQuasar();
const store = useSsContributionRuleStore();
const saving = ref(false);

const form = reactive<ContributionRuleFormModel>({
  code: '',
  name: '',
  description: '',
  priority: 10,
  employee_contribution_method: 'TIER_TABLE' as const,
  employer_contribution_method: 'TIER_TABLE' as const,
  employee_fixed_weekly_amount: null as number | null,
  employer_fixed_weekly_amount: null as number | null,
  employee_rate: null as number | null,
  employer_rate: null as number | null,
  skip_tier_lookup: false,
  conditionsJson: '{\n  "any": []\n}',
  state: 'active' as const,
});

const isOpen = computed({
  get: () => store.isCreateOpen,
  set: (v) => { store.isCreateOpen = v; },
});

function closeDialog() {
  store.closeCreateDialog();
}

async function save() {
  saving.value = true;
  try {
    const conditions = JSON.parse(form.conditionsJson) as Record<string, unknown>;
    await store.createRule({
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description || null,
      priority: form.priority,
      employee_contribution_method: form.employee_contribution_method,
      employer_contribution_method: form.employer_contribution_method,
      employee_fixed_weekly_amount: form.employee_fixed_weekly_amount,
      employer_fixed_weekly_amount: form.employer_fixed_weekly_amount,
      employee_rate: form.employee_rate,
      employer_rate: form.employer_rate,
      skip_tier_lookup: form.skip_tier_lookup,
      conditions,
      state: form.state,
    });
    $q.notify({ color: 'positive', position: 'top', message: 'Rule created.' });
    closeDialog();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error instanceof Error ? error.message : 'Failed to create rule.',
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

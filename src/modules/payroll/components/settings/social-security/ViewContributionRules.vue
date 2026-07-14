<template>
  <div>
    <q-card-section class="row items-center q-gutter-sm">
      <q-space />
      <q-btn dense icon="add_circle" color="primary" @click="store.openCreateDialog()">
        Add Contribution Rule
      </q-btn>
    </q-card-section>

    <q-table
      title="Contribution Rules"
      :rows="store.rules"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      :loading="store.isLoading"
      no-data-label="No contribution rules"
    >
      <template #body-cell-methods="props">
        <q-td :props="props">
          Emp: {{ props.row.employee_contribution_method }}
          <span v-if="props.row.employee_fixed_weekly_amount != null">
            (${{ props.row.employee_fixed_weekly_amount }})
          </span>
          <br />
          Er: {{ props.row.employer_contribution_method }}
          <span v-if="props.row.employer_fixed_weekly_amount != null">
            (${{ props.row.employer_fixed_weekly_amount }})
          </span>
        </q-td>
      </template>
      <template #body-cell-state="props">
        <q-td :props="props">
          <q-badge :color="props.row.state === 'active' ? 'positive' : 'grey'">
            {{ props.row.state }}
          </q-badge>
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn flat round dense icon="edit" color="primary" size="sm" @click="store.setRuleToEdit(props.row)" />
          <q-btn flat round dense icon="delete" color="negative" size="sm" @click="onDelete(props.row)" />
        </q-td>
      </template>
    </q-table>

    <AddContributionRule />
    <EditContributionRule />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import {
  useSsContributionRuleStore,
  type SocialSecurityContributionRule,
} from 'src/stores/ss-contribution-rule-store';
import AddContributionRule from './AddContributionRule.vue';
import EditContributionRule from './EditContributionRule.vue';

const store = useSsContributionRuleStore();
const $q = useQuasar();

const columns: QTableProps['columns'] = [
  { name: 'code', label: 'Code', field: 'code', align: 'left', sortable: true },
  { name: 'name', label: 'Name', field: 'name', align: 'left' },
  { name: 'priority', label: 'Priority', field: 'priority', align: 'right', sortable: true },
  { name: 'methods', label: 'Methods', field: 'methods', align: 'left' },
  { name: 'state', label: 'State', field: 'state', align: 'center' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

function onDelete(row: SocialSecurityContributionRule) {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Delete rule "${row.name}"?`,
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteRule(row.id);
        $q.notify({ color: 'positive', position: 'top', message: 'Rule deleted.' });
      } catch (error) {
        $q.notify({
          color: 'negative',
          position: 'top',
          message: error instanceof Error ? error.message : 'Delete failed.',
        });
      }
    })();
  });
}

onMounted(() => {
  void store.fetchRules();
});
</script>

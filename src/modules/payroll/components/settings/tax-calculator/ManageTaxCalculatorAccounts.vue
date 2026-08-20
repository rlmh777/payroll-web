<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <q-card-section class="row items-center q-gutter-sm">
        <div>
          <div class="text-h6">GST Calculator</div>
          <div class="text-body2 text-grey-7">
            Map each spreadsheet line to tax types. QuickBooks accounts apply to GROSS detail rows; NET totals are
            calculator roll-up lines with their own amounts and tax rules.
          </div>
        </div>
        <q-space />
        <q-btn
          v-if="tab === 'accounts'"
          dense
          icon="add_circle"
          color="primary"
          label="Add line"
          @click="store.isCreateAccountOpen = true"
        />
        <q-btn
          v-else
          dense
          icon="add_circle"
          color="primary"
          label="Add rate"
          @click="store.isCreateRateOpen = true"
        />
      </q-card-section>

      <q-tabs v-model="tab" dense class="text-grey-8" active-color="primary" indicator-color="primary" align="left">
        <q-tab name="accounts" label="Calculator lines" />
        <q-tab name="rates" label="GST / Tax Rates" />
      </q-tabs>
      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="accounts" class="q-pa-none">
          <div class="q-pa-sm">
            <q-input
              v-model="accountSearch"
              dense
              outlined
              placeholder="Search by code or name…"
              clearable
              class="q-mb-xs"
              style="max-width: 360px"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <q-table
            :rows="filteredAccounts"
            :columns="accountColumns"
            row-key="id"
            flat
            dense
            :loading="store.isLoadingAccounts"
            no-data-label="No calculator lines"
            :pagination="{ rowsPerPage: 20 }"
          >
            <template #body-cell-line_kind="props">
              <q-td :props="props">
                <q-badge :color="lineKindColor(props.row)" :label="lineKindLabel(props.row)" />
              </q-td>
            </template>
            <template #body-cell-line="props">
              <q-td :props="props">
                <div :style="{ paddingLeft: props.row.parent_id ? '16px' : undefined }">
                  <template v-if="props.row.qb_code || props.row.qb_name">
                    <span v-if="lineKind(props.row) === 'net_total'" class="text-grey-7">{{ props.row.qb_code }} · </span>
                    <span>{{ formatLineLabel(props.row) }}</span>
                  </template>
                  <span v-else-if="props.row.account">
                    {{ props.row.account.code1 }} — {{ props.row.account.name }}
                  </span>
                  <span v-else class="text-grey-6">Missing line</span>
                </div>
              </q-td>
            </template>
            <template #body-cell-parent="props">
              <q-td :props="props">
                <span v-if="props.row.parent">
                  {{ props.row.parent.qb_code }} — {{ props.row.parent.qb_name }}
                </span>
                <span v-else class="text-grey-6">—</span>
              </q-td>
            </template>
            <template #body-cell-business_tax_code="props">
              <q-td :props="props">
                {{ formatRateAssignments(props.row).business }}
              </q-td>
            </template>
            <template #body-cell-gst_code="props">
              <q-td :props="props">
                {{ formatRateAssignments(props.row).gst }}
              </q-td>
            </template>
            <template #body-cell-btb="props">
              <q-td :props="props">{{ props.row.include_btb ? 'Yes' : '—' }}</q-td>
            </template>
            <template #body-cell-status="props">
              <q-td :props="props">
                <q-badge :color="props.row.is_active ? 'positive' : 'grey'">
                  {{ props.row.is_active ? 'Active' : 'Inactive' }}
                </q-badge>
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" class="text-right">
                <q-btn flat round dense icon="edit" color="primary" size="sm" @click="store.setAccountToEdit(props.row)" />
                <q-btn flat round dense icon="delete" color="negative" size="sm" @click="onDeleteLine(props.row)" />
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <q-tab-panel name="rates" class="q-pa-none">
          <q-table
            :rows="store.rates"
            :columns="rateColumns"
            row-key="id"
            flat
            dense
            :loading="store.isLoadingRates"
            no-data-label="No tax rates"
            :pagination="{ rowsPerPage: 20 }"
          >
            <template #body-cell-rate="props">
              <q-td :props="props">
                {{ formatRate(props.row) }}
              </q-td>
            </template>
            <template #body-cell-status="props">
              <q-td :props="props">
                <q-badge :color="props.row.is_active ? 'positive' : 'grey'">
                  {{ props.row.is_active ? 'Active' : 'Inactive' }}
                </q-badge>
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" class="text-right">
                <q-btn flat round dense icon="edit" color="primary" size="sm" @click="store.setRateToEdit(props.row)">
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <q-btn flat round dense icon="delete" color="negative" size="sm" @click="onDeleteRate(props.row)">
                  <q-tooltip>Delete</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <TaxCalculatorAccountDialog />
    <TaxCalculatorRateDialog />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import {
  useTaxCalculatorStore,
  type TaxCalculatorAccount,
  type TaxCalculatorLineKind,
  type TaxCalculatorRate,
} from '@payroll/stores/tax-calculator-store';
import TaxCalculatorAccountDialog from './TaxCalculatorAccountDialog.vue';
import TaxCalculatorRateDialog from './TaxCalculatorRateDialog.vue';

const $q = useQuasar();
const store = useTaxCalculatorStore();
const tab = ref<'accounts' | 'rates'>('accounts');
const accountSearch = ref('');

const filteredAccounts = computed(() => {
  const q = accountSearch.value.trim().toLowerCase();
  if (!q) return store.accounts;
  return store.accounts.filter((row) => {
    const code = (row.qb_code ?? '').toLowerCase();
    const name = (row.qb_name ?? '').toLowerCase();
    const parentName = (row.parent?.qb_name ?? '').toLowerCase();
    return code.includes(q) || name.includes(q) || parentName.includes(q);
  });
});

const accountColumns: QTableProps['columns'] = [
  { name: 'line_kind', label: 'Type', field: 'line_kind', align: 'left' },
  { name: 'line', label: 'Calculator line', field: 'qb_code', align: 'left' },
  { name: 'parent', label: 'Parent', field: 'parent_id', align: 'left' },
  { name: 'business_tax_code', label: 'Business tax', field: 'business_tax_code', align: 'left' },
  { name: 'gst_code', label: 'GST', field: 'gst_code', align: 'left' },
  { name: 'btb', label: 'BTB hotel tax', field: 'include_btb', align: 'left' },
  { name: 'status', label: 'Status', field: 'is_active', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'right' },
];

function lineKind(row: TaxCalculatorAccount): TaxCalculatorLineKind {
  if (row.line_kind) {
    return row.line_kind;
  }
  const name = (row.qb_name ?? '').trim().toLowerCase();
  if (row.is_rollup || name.startsWith('total ') || name.includes('(net)')) {
    return 'net_total';
  }
  return 'qb_account';
}

function lineKindLabel(row: TaxCalculatorAccount) {
  switch (lineKind(row)) {
    case 'net_total':
      return 'NET total';
    case 'section':
      return 'Section';
    default:
      return 'QB account';
  }
}

function lineKindColor(row: TaxCalculatorAccount) {
  switch (lineKind(row)) {
    case 'net_total':
      return 'blue-7';
    case 'section':
      return 'grey-7';
    default:
      return 'primary';
  }
}

function formatLineLabel(row: TaxCalculatorAccount) {
  if (lineKind(row) === 'net_total') {
    return row.qb_name ?? 'NET total';
  }
  return `${row.qb_code ?? ''} — ${row.qb_name ?? ''}`.replace(/^ — /, '');
}

function formatRateAssignments(row: TaxCalculatorAccount) {
  const assignments = row.rate_assignments ?? [];
  if (!assignments.length) {
    const businessValues = row.business_tax_codes?.length
      ? row.business_tax_codes
      : row.business_tax_code
        ? [row.business_tax_code]
        : [];
    const gstValues = row.gst_codes?.length ? row.gst_codes : row.gst_code ? [row.gst_code] : [];
    return {
      business: businessValues.length ? businessValues.join(', ') : '—',
      gst: gstValues.length ? gstValues.join(', ') : '—',
    };
  }

  const business = assignments
    .filter((item) => item.category === 'business_tax')
    .map((item) => item.code.replaceAll('_', ' '))
    .join(', ');
  const gst = assignments
    .filter((item) => item.category === 'gst')
    .map((item) => item.code.replaceAll('_', ' '))
    .join(', ');

  return {
    business: business || '—',
    gst: gst || '—',
  };
}

const rateColumns: QTableProps['columns'] = [
  { name: 'name', label: 'Name', field: 'name', align: 'left' },
  { name: 'code', label: 'Code', field: 'code', align: 'left' },
  { name: 'category', label: 'Category', field: 'category', align: 'left' },
  { name: 'rate', label: 'Rate', field: 'rate', align: 'right' },
  { name: 'iris_line', label: 'IRIS line', field: 'iris_line', align: 'left' },
  { name: 'status', label: 'Status', field: 'is_active', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'right' },
];

function formatRate(rate: TaxCalculatorRate) {
  if (rate.code === 'GST_INPUT_RECOVERY_MULTIPLIER') {
    return `${Number(rate.rate).toFixed(2)}×`;
  }
  return `${(Number(rate.rate) * 100).toFixed(2)}%`;
}

function onDeleteLine(row: TaxCalculatorAccount) {
  $q.dialog({
    title: 'Remove line',
    message: 'Remove this line from the GST calculator?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteAccount(row.id);
        $q.notify({ color: 'positive', message: 'Line removed.', position: 'top' });
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: error instanceof Error ? error.message : 'Delete failed.',
          position: 'top',
        });
      }
    })();
  });
}

function onDeleteRate(rate: TaxCalculatorRate) {
  $q.dialog({
    title: 'Delete rate',
    message: `Delete ${rate.name}? Lines using this type will need remapping.`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteRate(rate.id);
        $q.notify({ color: 'positive', message: 'Rate deleted.', position: 'top' });
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: error instanceof Error ? error.message : 'Delete failed.',
          position: 'top',
        });
      }
    })();
  });
}

onMounted(() => {
  void store.fetchRates();
  void store.fetchAccounts();
});
</script>

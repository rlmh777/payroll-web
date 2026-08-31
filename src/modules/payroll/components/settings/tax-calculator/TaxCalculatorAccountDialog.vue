<template>
  <q-dialog v-model="isOpen" position="right">
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">{{ isEdit ? 'Edit calculator line' : 'Add calculator line' }}</div>
      </AppDialogHeader>

      <AppDialogBody>
        <q-form id="tax-calculator-account-form" @submit.prevent="save">
          <AppDialogForm>
            <div class="col-12">
              <q-select
                v-model="form.line_kind"
                :options="lineKindOptions"
                emit-value
                map-options
                label="Type *"
                hint="QB account for GROSS/detail lines, NET total for roll-up rows, Section for headings."
                dense
                outlined
                :disable="saving"
              />
            </div>
            <div v-if="form.line_kind === 'net_total'" class="col-12">
              <q-banner dense rounded class="bg-blue-1 text-blue-10">
                Spreadsheet NET total — not a QuickBooks GL account. Tax types apply to this roll-up line only.
              </q-banner>
            </div>
            <div v-else-if="form.line_kind === 'section'" class="col-12">
              <q-banner dense rounded class="bg-grey-2 text-grey-9">
                Section heading — used for grouping only. Assign taxes on detail and NET total lines.
              </q-banner>
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.qb_code"
                :label="codeLabel"
                :hint="codeHint"
                dense
                outlined
                :disable="saving"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.qb_name"
                :label="nameLabel"
                :hint="nameHint"
                dense
                outlined
                :disable="saving"
              />
            </div>
            <div class="col-12">
              <q-select
                v-model="form.parent_id"
                :options="parentOptions"
                emit-value
                map-options
                clearable
                label="Parent line"
                hint="Optional. Groups this line under a section or total in the tree."
                dense
                outlined
                :disable="saving"
              />
            </div>
            <template v-if="form.line_kind !== 'section'">
              <div class="col-12">
                <q-select
                  v-model="form.business_tax_codes"
                  :options="businessOptions"
                  emit-value
                  map-options
                  multiple
                  use-chips
                  clearable
                  label="Business tax"
                  dense
                  outlined
                  :disable="saving"
                />
              </div>
              <div class="col-12">
                <q-select
                  v-model="form.gst_codes"
                  :options="gstOptions"
                  emit-value
                  map-options
                  multiple
                  use-chips
                  clearable
                  label="GST"
                  dense
                  outlined
                  :disable="saving"
                />
              </div>
              <div class="col-12">
                <q-toggle v-model="form.include_btb" label="Include in BTB hotel tax" :disable="saving" />
              </div>
            </template>
            <div class="col-12 col-sm-6">
              <q-input v-model.number="form.sort_order" type="number" label="Sort order" dense outlined :disable="saving" />
            </div>
            <div class="col-12 col-sm-6">
              <q-toggle v-model="form.is_active" label="Active" :disable="saving" />
            </div>
          </AppDialogForm>
        </q-form>
      </AppDialogBody>

      <AppDialogActions>
        <q-btn flat label="Cancel" color="grey" :disable="saving" @click="close" />
        <q-btn
          type="submit"
          form="tax-calculator-account-form"
          color="primary"
          :loading="saving"
          :label="isEdit ? 'Save' : 'Create'"
        />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import {
  useTaxCalculatorStore,
  type TaxCalculatorAccount,
  type TaxCalculatorLineKind,
} from '@payroll/stores/tax-calculator-store';

const $q = useQuasar();
const store = useTaxCalculatorStore();
const saving = ref(false);

const form = reactive({
  id: '',
  qb_code: '',
  qb_name: '',
  parent_id: null as string | null,
  line_kind: 'qb_account' as TaxCalculatorLineKind,
  business_tax_codes: [] as string[],
  gst_codes: [] as string[],
  include_btb: false,
  sort_order: 0,
  is_active: true,
});

const isEdit = computed(() => !!store.accountToEdit);

const lineKindOptions: Array<{ label: string; value: TaxCalculatorLineKind }> = [
  { label: 'QB account', value: 'qb_account' },
  { label: 'NET total', value: 'net_total' },
  { label: 'Section', value: 'section' },
];

function inferredLineKind(code: string, name: string, row?: TaxCalculatorAccount | null): TaxCalculatorLineKind {
  if (row?.line_kind) {
    return row.line_kind;
  }
  const normalized = name.trim().toLowerCase();
  if (row?.is_rollup || normalized.startsWith('total ') || normalized.includes('(net)')) {
    return 'net_total';
  }
  return 'qb_account';
}

const codeLabel = computed(() => {
  if (form.line_kind === 'net_total') return 'Roll-up code *';
  if (form.line_kind === 'section') return 'Section code *';
  return 'QuickBooks code *';
});

const codeHint = computed(() => {
  if (form.line_kind === 'net_total') return 'Group prefix from the sheet, e.g. 4501';
  if (form.line_kind === 'section') return 'Section prefix, e.g. 4500';
  return 'Example: 4500 or 4501A';
});

const nameLabel = computed(() => {
  if (form.line_kind === 'net_total') return 'Spreadsheet line label *';
  return 'Line label *';
});

const nameHint = computed(() => {
  if (form.line_kind === 'net_total') return 'Matches the Taxes Calculator total row, e.g. Total 4501 · … (NET)';
  return 'Matches the Taxes Calculator sheet label';
});

const businessOptions = computed(() =>
  store.businessTaxRates.map((rate) => ({ label: rate.name, value: rate.code })),
);
const gstOptions = computed(() =>
  store.gstRates.map((rate) => ({ label: rate.name, value: rate.code })),
);
const parentOptions = computed(() =>
  store.accounts
    .filter((account) => account.id !== form.id)
    .map((account) => ({
      label: `${account.qb_code ?? '—'} — ${account.qb_name ?? account.account?.name ?? 'Line'}`,
      value: account.id,
    })),
);
const isOpen = computed({
  get: () => store.isCreateAccountOpen || !!store.accountToEdit,
  set: (value) => {
    if (!value) close();
  },
});

function loadTaxCodes(row: TaxCalculatorAccount) {
  const assignments = row.rate_assignments ?? [];
  if (assignments.length) {
    form.business_tax_codes = assignments
      .filter((item) => item.category === 'business_tax')
      .map((item) => item.code);
    form.gst_codes = assignments.filter((item) => item.category === 'gst').map((item) => item.code);
    return;
  }

  form.business_tax_codes = [
    ...(row.business_tax_codes ?? (row.business_tax_code ? [row.business_tax_code] : [])),
  ];
  form.gst_codes = [...(row.gst_codes ?? (row.gst_code ? [row.gst_code] : []))];
}

watch(
  () => store.accountToEdit,
  (row) => {
    if (!row) return;
    form.id = row.id;
    form.qb_code = row.qb_code ?? row.account?.code1 ?? '';
    form.qb_name = row.qb_name ?? row.account?.name ?? '';
    form.parent_id = row.parent_id ?? null;
    form.line_kind = inferredLineKind(form.qb_code, form.qb_name, row);
    loadTaxCodes(row);
    form.include_btb = row.include_btb;
    form.sort_order = row.sort_order;
    form.is_active = row.is_active;
  },
);

function reset() {
  form.id = '';
  form.qb_code = '';
  form.qb_name = '';
  form.parent_id = null;
  form.line_kind = 'qb_account';
  form.business_tax_codes = [];
  form.gst_codes = [];
  form.include_btb = false;
  form.sort_order = 0;
  form.is_active = true;
}

function close() {
  store.isCreateAccountOpen = false;
  store.setAccountToEdit(null);
  reset();
}

async function save() {
  if (!form.qb_code.trim() || !form.qb_name.trim()) {
    $q.notify({ color: 'negative', message: 'Enter the code and line label.', position: 'top' });
    return;
  }

  const payload = {
    qb_code: form.qb_code,
    qb_name: form.qb_name,
    parent_id: form.parent_id,
    line_kind: form.line_kind,
    business_tax_codes: form.business_tax_codes,
    gst_codes: form.gst_codes,
    include_btb: form.include_btb,
    sort_order: form.sort_order,
    is_active: form.is_active,
  };

  saving.value = true;
  try {
    if (isEdit.value) {
      await store.updateAccount(form.id, payload);
    } else {
      await store.createAccount(payload);
    }
    $q.notify({ color: 'positive', message: 'Calculator line saved.', position: 'top' });
    close();
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error instanceof Error ? error.message : 'Save failed.',
      position: 'top',
    });
  } finally {
    saving.value = false;
  }
}
</script>

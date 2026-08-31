<template>
  <div class="gst-calculator">
    <div class="gst-calculator__header">
      <div class="text-h5 text-weight-bold q-mb-xs">GST Calculator</div>
      <div class="text-body2 text-grey-7 q-mb-md">
        Monthly Business Tax, GST, and BTB filing worksheet. Configure accounts and rates under Settings.
      </div>
    </div>

    <q-banner v-if="store.error" rounded class="bg-red-1 text-red-9 q-mb-md">
      <template #avatar><q-icon name="error_outline" /></template>
      {{ store.error }}
    </q-banner>

    <q-card flat bordered class="gst-calculator__toolbar q-mb-md">
      <q-card-section>
        <div class="gst-calculator__toolbar-row">
          <q-select
            v-model="periodKey"
            :options="periodOptions"
            emit-value
            map-options
            label="Period"
            outlined
            dense
            class="gst-calculator__period"
            :disable="store.isLoadingWorkspace"
          />
          <q-btn
            outline
            dense
            no-caps
            color="primary"
            icon="add"
            label="Add period"
            :disable="store.isLoadingWorkspace"
            @click="isAddPeriodOpen = true"
          />
          <q-file
            :model-value="null"
            outlined
            dense
            accept=".xlsx"
            label="Upload accounts/GST"
            class="gst-calculator__upload"
            :loading="store.isImporting"
            :disable="store.isLoadingWorkspace || store.isImporting || store.isImportingPurchaseLedger"
            @update:model-value="onWorkbookSelected"
          >
            <template #prepend>
              <q-icon name="upload_file" />
            </template>
          </q-file>
          <q-file
            :model-value="null"
            outlined
            dense
            accept=".xlsx"
            label="Upload purchase ledger"
            class="gst-calculator__upload"
            :loading="store.isImportingPurchaseLedger"
            :disable="store.isLoadingWorkspace || store.isImportingPurchaseLedger || store.isImporting"
            @update:model-value="onPurchaseLedgerSelected"
          >
            <template #prepend>
              <q-icon name="upload_file" />
            </template>
          </q-file>
          <div class="gst-calculator__toolbar-actions">
            <q-btn
              outline
              dense
              no-caps
              color="negative"
              icon="delete_outline"
              label="Clear all"
              :loading="isClearing"
              :disable="!canClearData || store.isLoadingWorkspace || store.isSaving"
              @click="confirmClearAll"
            />
            <q-btn
              dense
              no-caps
              color="primary"
              icon="save"
              label="Save"
              :loading="store.isSaving"
              :disable="!workspace || isClearing"
              @click="save"
            />
          </div>
        </div>
        <div
          v-if="workspace?.import_filename || workspace?.import_purchase_ledger_filename"
          class="text-caption text-grey-7 q-mt-sm"
        >
          <span v-if="workspace?.import_filename">Accounts/GST: {{ workspace.import_filename }}</span>
          <span v-if="workspace?.import_filename && workspace?.import_purchase_ledger_filename"> · </span>
          <span v-if="workspace?.import_purchase_ledger_filename">
            Purchase ledger: {{ workspace.import_purchase_ledger_filename }}
          </span>
        </div>
      </q-card-section>
    </q-card>

    <q-inner-loading :showing="store.isLoadingWorkspace" />

    <template v-if="workspace">
      <div class="gst-calculator__body">
      <q-tabs v-model="tab" dense class="gst-calculator__tabs text-grey-8" active-color="primary" indicator-color="primary" align="left">
        <q-tab name="accounts" label="Accounts" />
        <q-tab name="gst" label="GST" />
        <q-tab name="purchase-ledger" label="Purchase Ledger" />
        <q-tab name="results" label="Results" />
      </q-tabs>
      <q-separator />

      <q-tab-panels v-model="tab" class="gst-calculator__panels">
        <q-tab-panel name="accounts" class="gst-accounts-panel q-pa-none q-pt-md">
          <q-banner v-if="workspace.lines.length === 0" class="bg-blue-1 text-grey-9 q-mb-md" rounded>
            Upload the monthly QuickBooks workbook. Accounts (P&amp;L or Taxes Calculator) and GST register sheets are detected from their contents.
            Map tax types under Settings → GST Calculator. Map section totals such as Total 4500 · Tour Income for tour operator income.
          </q-banner>

          <div v-else class="gst-accounts-wrap">
            <q-markup-table flat bordered dense class="gst-accounts-table">
              <thead>
                <tr>
                  <th class="text-left">Code</th>
                  <th class="text-left">Account</th>
                  <th class="text-right">Amount</th>
                  <th
                    v-for="column in taxColumns"
                    :key="column.code"
                    class="text-right gst-tax-header"
                  >
                    {{ shortTaxLabel(column.name) }}
                    <q-tooltip>
                      {{ column.name }} — {{ formatRate(column.rate) }}
                    </q-tooltip>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="line in workspace.lines"
                  :key="lineKey(line)"
                  :class="rowClass(line)"
                  :style="groupStyle(line)"
                >
                  <template v-if="isHeading(line)">
                    <td class="text-left" :colspan="2">{{ line.account_name }}</td>
                    <td :colspan="1 + taxColumns.length" />
                  </template>
                  <template v-else>
                    <td class="text-left">{{ line.account_code || '—' }}</td>
                    <td class="text-left" :style="{ paddingLeft: labelIndent(line) }">{{ line.account_name }}</td>
                    <td class="gst-amount-cell" :class="{ 'text-negative': isNegativeAmount(line) }">
                      <q-input
                        v-if="isAmountEditable(line)"
                        v-model.number="line.amount"
                        type="number"
                        step="0.01"
                        dense
                        outlined
                        :input-class="['text-right', isNegativeAmount(line) ? 'text-negative' : '']"
                        @change="recalculate"
                      />
                      <span v-else>{{ money(line.amount) }}</span>
                    </td>
                    <td
                      v-for="column in taxColumns"
                      :key="`${lineKey(line)}-${column.code}`"
                      class="text-right"
                    >
                      {{ taxCell(line, column.code) }}
                    </td>
                  </template>
                </tr>
              </tbody>
              <tfoot>
                <tr class="text-weight-bold">
                  <td class="text-left" colspan="2">Total</td>
                  <td class="text-right">{{ money(amountTotal) }}</td>
                  <td
                    v-for="column in taxColumns"
                    :key="`base-total-${column.code}`"
                    class="text-right"
                  >
                    {{ money(taxBases[column.code] ?? 0) }}
                  </td>
                </tr>
                <tr class="text-weight-bold">
                  <td class="text-left" colspan="2">Total Taxes</td>
                  <td class="text-right">{{ money(amountTotal) }}</td>
                  <td
                    v-for="column in taxColumns"
                    :key="`tax-total-${column.code}`"
                    class="text-right"
                  >
                    {{ money(taxTotals[column.code] ?? 0) }}
                  </td>
                </tr>
              </tfoot>
            </q-markup-table>
          </div>

          <div class="gst-accounts-inputs row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input
                v-model.number="workspace.total_debits"
                type="number"
                step="0.01"
                outlined
                prefix="$"
                label="Total Debits"
                hint="Filled from Total 2251 · GST Payable debit on the GST sheet."
                @change="recalculate"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model.number="workspace.partial_exemptions_total"
                type="number"
                step="0.01"
                outlined
                prefix="$"
                label="Total partial exemptions"
                hint="Filled from Total 2251-a · Partial Exemption GST debit on the GST sheet."
                @change="recalculate"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model.number="workspace.net_of_2251"
                type="number"
                step="0.01"
                outlined
                prefix="$"
                label="Net of 2251 account"
                hint="Filled from Total 2251 · GST Payable balance on the GST sheet."
                @change="recalculate"
              />
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel name="gst" class="gst-sheet-panel q-pa-none q-pt-md">
          <q-banner v-if="!gstSheetRows.length" class="bg-blue-1 text-grey-9 q-mb-md" rounded>
            Upload the monthly QuickBooks workbook to view the imported GST sheet.
          </q-banner>
          <gst-sheet-table v-else :rows="gstSheetRows" />
        </q-tab-panel>

        <q-tab-panel name="purchase-ledger" class="purchase-ledger-tab q-pa-none q-pt-md">
          <purchase-ledger-panel
            :sheet="purchaseLedgerSheet"
            :excluded-names="purchaseLedgerExcludedNames"
            :taxable-ratio="partialExemption.gst_income_ratio"
            :complement-ratio="partialExemption.complement_ratio"
            :gst-rate="rateFor('GST_INCOME') || 0.125"
            :year="year"
            :month="month"
          />
        </q-tab-panel>

        <q-tab-panel name="results" class="gst-results-panel">
          <q-card flat bordered class="q-mb-lg">
            <q-card-section>
              <div class="text-subtitle1 text-weight-bold">Partial Exemption Method Calculations: GST</div>
              <div class="text-caption text-grey-7">
                Calculated from account GST columns, Total Debits, and Total Partial Exemptions entered on the Accounts tab.
              </div>
            </q-card-section>
            <q-markup-table flat dense>
              <thead>
                <tr>
                  <th class="text-left">Description</th>
                  <th class="text-right">Amount</th>
                  <th class="text-left">Note</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Income from GST 12.5% column:</td>
                  <td class="text-right">{{ money(partialExemption.gst_income) }}</td>
                  <td>{{ percentWhole(partialExemption.gst_income_ratio) }} of taxable + exempt</td>
                </tr>
                <tr>
                  <td>Zero rated Income GST column:</td>
                  <td class="text-right">{{ money(partialExemption.zero_rated_income) }}</td>
                  <td>Excluded from ratio (0% GST)</td>
                </tr>
                <tr>
                  <td>Exempt</td>
                  <td class="text-right">{{ money(partialExemption.exempt_income) }}</td>
                  <td>{{ percentWhole(partialExemption.exempt_ratio) }} of taxable + exempt</td>
                </tr>
                <tr>
                  <td>Total Value of Taxable &amp; Exempt:</td>
                  <td class="text-right">{{ money(partialExemption.total_value) }}</td>
                  <td>
                    {{ percentWhole(partialExemption.ratio_check) }}
                    (taxable + exempt shares; zero rated excluded)
                  </td>
                </tr>
                <tr class="text-weight-bold">
                  <td>Ratio of Taxable to Total Value of both Taxable &amp; Exempt</td>
                  <td class="text-right">{{ percentWhole(partialExemption.gst_income_ratio) }}</td>
                  <td>
                    {{ money(partialExemption.gst_income) }}
                    ÷ {{ money(partialExemption.total_value) }}
                  </td>
                </tr>
                <tr>
                  <td>Complement ratio (1 − taxable ratio)</td>
                  <td class="text-right">{{ percentWhole(partialExemption.complement_ratio) }}</td>
                  <td>Taxes:Partial: taxed share goes to standard rated; untaxed share plus non-payable GST goes to exempt. Only the taxable share of Taxes:GST is GST paid. Columns sum to Total Purchases (GST inclusive).</td>
                </tr>
                <tr>
                  <td>Total Partial Exemptions (see 2251 tab)</td>
                  <td class="text-right">{{ money(partialExemption.partial_exemptions_total) }}</td>
                  <td>Input tax that is neither directly related to Exempt (Zero Rated) or Taxable</td>
                </tr>
                <tr>
                  <td>Ratio % x Partial Exemptions Total</td>
                  <td class="text-right">{{ money(partialExemption.ratio_times_partial_exemptions) }}</td>
                  <td>Deduct from GST Ledger Line 250</td>
                </tr>
                <tr>
                  <td>Total Debits on 2251</td>
                  <td class="text-right">{{ money(partialExemption.total_debits) }}</td>
                  <td>Total entered from Invoices</td>
                </tr>
                <tr>
                  <td>Less Partial Exemptions Total</td>
                  <td class="text-right">{{ money(partialExemption.less_partial_exemptions) }}</td>
                  <td />
                </tr>
                <tr class="text-weight-medium">
                  <td />
                  <td class="text-right">{{ money(partialExemption.line_250) }}</td>
                  <td>Line 250 (Total from invoices minus EXEMPTIONS %)</td>
                </tr>
                <tr>
                  <td>Total Income from GST 12.5% column:</td>
                  <td class="text-right">{{ money(partialExemption.gst_income) }}</td>
                  <td />
                </tr>
                <tr>
                  <td>GST rate</td>
                  <td class="text-right">{{ percent(partialExemption.gst_rate) }}</td>
                  <td />
                </tr>
                <tr>
                  <td>Total GST due BEFORE Exemptions are applied:</td>
                  <td class="text-right">{{ money(partialExemption.gst_due_before_exemptions) }}</td>
                  <td />
                </tr>
                <tr>
                  <td />
                  <td class="text-right">{{ money(partialExemption.invoices_less_exemptions) }}</td>
                  <td>Total from Invoices less allowed Exemptions</td>
                </tr>
                <tr class="text-weight-bold">
                  <td>NET GST DUE FOR THIS MONTH:</td>
                  <td class="text-right">{{ money(partialExemption.net_gst_due) }}</td>
                  <td />
                </tr>
                <tr>
                  <td>Net of 2251 account</td>
                  <td class="text-right">{{ money(partialExemption.net_of_2251) }}</td>
                  <td />
                </tr>
                <tr class="text-weight-bold">
                  <td>Additional liability charged to rooms</td>
                  <td class="text-right">{{ money(partialExemption.additional_liability) }}</td>
                  <td />
                </tr>
              </tbody>
            </q-markup-table>
          </q-card>

          <div v-if="!results" class="text-grey-7">Enter amounts and save, or wait for recalculation of IRIS lines.</div>
          <template v-else>
            <div class="text-subtitle1 text-weight-bold q-mb-sm">Business tax (IRIS)</div>
            <q-markup-table flat bordered dense class="q-mb-lg">
              <thead>
                <tr>
                  <th class="text-left">Description</th>
                  <th class="text-right">Amount</th>
                  <th class="text-right">Tax</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Line 10 — Income</td>
                  <td class="text-right">{{ money(results.business_tax.iris.line_10) }}</td>
                  <td class="text-right">{{ money(results.business_tax.income_tax) }}</td>
                </tr>
                <tr>
                  <td>Line 20 — Professional services</td>
                  <td class="text-right">{{ money(results.business_tax.iris.line_20) }}</td>
                  <td class="text-right">{{ money(results.business_tax.professional_services_tax) }}</td>
                </tr>
                <tr>
                  <td>Line 120 — Tour operator</td>
                  <td class="text-right">{{ money(results.business_tax.iris.line_120) }}</td>
                  <td class="text-right">{{ money(results.business_tax.tour_operator_tax) }}</td>
                </tr>
                <tr>
                  <td>Line 110 — Dividend</td>
                  <td class="text-right">{{ money(results.business_tax.iris.line_110) }}</td>
                  <td class="text-right">{{ money(results.business_tax.dividend_tax) }}</td>
                </tr>
                <tr v-for="custom in results.business_tax.custom || []" :key="custom.code">
                  <td>{{ labelFor(custom.code) }}</td>
                  <td class="text-right">{{ money(custom.amount) }}</td>
                  <td class="text-right">{{ money(custom.tax) }}</td>
                </tr>
                <tr class="text-weight-bold">
                  <td>Total business tax</td>
                  <td />
                  <td class="text-right">{{ money(results.business_tax.total_tax) }}</td>
                </tr>
              </tbody>
            </q-markup-table>

            <div class="text-subtitle1 text-weight-bold q-mb-sm">GST (IRIS)</div>
            <q-markup-table flat bordered dense class="q-mb-lg">
              <tbody>
                <tr><td>Line 100 — Total incomes</td><td class="text-right">{{ money(results.gst.line_100) }}</td></tr>
                <tr><td>Line 110 — Zero income</td><td class="text-right">{{ money(results.gst.line_110) }}</td></tr>
                <tr><td>Line 120 — Exempt income</td><td class="text-right">{{ money(results.gst.line_120) }}</td></tr>
                <tr class="text-weight-medium"><td>Line 130 — Total</td><td class="text-right">{{ money(results.gst.line_130) }}</td></tr>
                <tr><td>Line 140 — GST on total income</td><td class="text-right">{{ money(results.gst.line_140) }}</td></tr>
                <tr><td>Line 210</td><td class="text-right">{{ money(results.gst.line_210) }}</td></tr>
                <tr><td>Line 220</td><td class="text-right">{{ money(results.gst.line_220) }}</td></tr>
                <tr><td>Line 230</td><td class="text-right">{{ money(results.gst.line_230) }}</td></tr>
                <tr><td>Line 250 — GST paid on domestic taxable supplies</td><td class="text-right">{{ money(results.gst.line_250) }}</td></tr>
                <tr><td>Line 300 — Tax payable for this tax period</td><td class="text-right">{{ money(results.gst.line_300) }}</td></tr>
                <tr class="text-weight-bold"><td>Line 360 — Tax due for this period</td><td class="text-right">{{ money(results.gst.line_360) }}</td></tr>
              </tbody>
            </q-markup-table>

            <div class="text-subtitle1 text-weight-bold q-mb-sm">BTB hotel tax</div>
            <q-markup-table flat bordered dense class="q-mb-lg">
              <tbody>
                <tr><td>Base</td><td class="text-right">{{ money(results.btb.base) }}</td></tr>
                <tr class="text-weight-bold"><td>BTB tax</td><td class="text-right">{{ money(results.btb.tax) }}</td></tr>
              </tbody>
            </q-markup-table>

            <q-banner class="bg-primary text-white" rounded>
              Total this month (business tax + GST due + BTB):
              <span class="text-weight-bold q-ml-sm">{{ money(results.combined_total) }}</span>
            </q-banner>
          </template>
        </q-tab-panel>
      </q-tab-panels>
      </div>
    </template>

    <q-dialog v-model="isAddPeriodOpen" position="right">
      <q-card class="q-drawer-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Add period</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="text-caption text-grey-7 q-mb-md">
            Current or previous months only. Future periods cannot be added.
          </div>
          <q-form class="q-gutter-md" @submit.prevent="addPeriod">
            <q-input
              v-model.number="newPeriodYear"
              type="number"
              outlined
              dense
              label="Year"
              :min="2000"
              :max="currentYear"
              :rules="[validateNewYear]"
            />
            <q-select
              v-model="newPeriodMonth"
              :options="addableMonthOptions"
              emit-value
              map-options
              outlined
              dense
              label="Month"
              :rules="[validateNewMonth]"
            />
            <q-card-actions align="right">
              <q-btn flat label="Cancel" color="grey" v-close-popup />
              <q-btn type="submit" color="primary" label="Add" />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import {
  useTaxCalculatorStore,
  type TaxCalculatorPurchaseLedgerExcludedName,
  type TaxCalculatorPurchaseLedgerSheet,
  type TaxCalculatorLine,
} from '@payroll/stores/tax-calculator-store';
import GstSheetTable from './GstSheetTable.vue';
import PurchaseLedgerPanel from './PurchaseLedgerPanel.vue';

const $q = useQuasar();
const store = useTaxCalculatorStore();
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const year = ref(currentYear);
const month = ref(currentMonth);
const tab = ref('accounts');
const isAddPeriodOpen = ref(false);
const isClearing = ref(false);
const newPeriodYear = ref(currentYear);
const newPeriodMonth = ref(currentMonth);
const addedPeriods = ref<Array<{ year: number; month: number }>>([
  { year: currentYear, month: currentMonth },
]);

const monthOptions = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
].map((label, index) => ({ label, value: index + 1 }));

const periodKey = computed({
  get: () => periodValue(year.value, month.value),
  set: (value: string) => {
    const parsed = parsePeriod(value);
    if (!parsed) return;
    year.value = parsed.year;
    month.value = parsed.month;
  },
});

const addableMonthOptions = computed(() => {
  const yearValue = Number(newPeriodYear.value);
  const lastMonth = yearValue > currentYear
    ? 0
    : yearValue === currentYear
      ? currentMonth
      : 12;
  return monthOptions.filter((option) => option.value <= lastMonth);
});

const workspace = computed(() => store.workspace);
const canClearData = computed(() => {
  if (!workspace.value) return false;
  return Boolean(
    workspace.value.run?.id
    || workspace.value.lines.length
    || workspace.value.import_filename
    || (workspace.value.import_gst_sheet?.length ?? 0) > 0
    || (workspace.value.import_purchase_ledger?.rows?.length ?? 0) > 0
    || Number(workspace.value.total_debits || 0) !== 0
    || Number(workspace.value.partial_exemptions_total || 0) !== 0
    || Number(workspace.value.line_220 || 0) !== 0
    || Number(workspace.value.net_of_2251 || 0) !== 0,
  );
});
const gstSheetRows = computed(() => workspace.value?.import_gst_sheet ?? []);
const purchaseLedgerSheet = computed((): TaxCalculatorPurchaseLedgerSheet => (
  workspace.value?.import_purchase_ledger ?? {
    format: 'transaction',
    columns: [],
    rows: [],
    name_column: 'F',
    class_column: 'L',
    debit_column: 'N',
    date_column: 'B',
    tin_column: 'J',
    invoice_column: 'D',
  }
));
const purchaseLedgerExcludedNames = computed((): TaxCalculatorPurchaseLedgerExcludedName[] => (
  workspace.value?.purchase_ledger_excluded_names ?? []
));
const results = computed(() => store.workspace?.results ?? null);
const periodOptions = computed(() => {
  const items = new Map<string, { label: string; value: string }>();

  for (const period of addedPeriods.value) {
    addPeriodOption(items, period.year, period.month);
  }

  for (const run of store.workspace?.previous_runs ?? []) {
    addPeriodOption(items, run.year, run.month);
  }

  addPeriodOption(items, year.value, month.value);

  return [...items.values()].sort((a, b) => b.value.localeCompare(a.value));
});
const taxColumns = computed(() =>
  store.rates
    .filter((rate) => rate.applies_to_accounts && rate.is_active)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order),
);
const amountTotal = computed(() =>
  (workspace.value?.lines ?? []).reduce((sum, line) => {
    if (!isTaxBaseLine(line)) return sum;
    return sum + Number(line.amount || 0);
  }, 0),
);
const taxBases = computed(() => {
  const totals: Record<string, number> = {};
  for (const column of taxColumns.value) {
    totals[column.code] = (workspace.value?.lines ?? []).reduce((sum, line) => {
      if (!lineApplies(line, column.code)) return sum;
      const amount = Number(line.amount || 0);
      if (amount < 0) return sum;
      return sum + amount;
    }, 0);
  }
  return totals;
});
const taxTotals = computed(() => {
  const totals: Record<string, number> = {};
  for (const column of taxColumns.value) {
    totals[column.code] = (workspace.value?.lines ?? []).reduce(
      (sum, line) => sum + (appliedTax(line, column.code) ?? 0),
      0,
    );
  }
  return totals;
});
const partialExemption = computed(() => {
  const lines = workspace.value?.lines ?? [];
  const gstSum = (code: string) =>
    lines
      .filter((line) => line.gst_code === code)
      .reduce((sum, line) => sum + Number(line.amount || 0), 0);

  const gstIncome = gstSum('GST_INCOME');
  const gstZero = gstSum('GST_ZERO_INCOME');
  const gstExempt = gstSum('GST_EXEMPT_INCOME');
  // Zero-rated income is excluded from the taxable/exempt ratio base.
  const totalValue = gstIncome + gstExempt;
  const gstIncomeRatio = roundRatio(totalValue !== 0 ? gstIncome / totalValue : 0);
  const exemptRatio = roundRatio(Math.max(0, 1 - gstIncomeRatio));
  const complementRatio = exemptRatio;
  const partialTotal = Number(workspace.value?.partial_exemptions_total || 0);
  const ratioTimes = partialTotal * gstIncomeRatio;
  const totalDebits = Number(workspace.value?.total_debits ?? workspace.value?.gst_value_entered ?? 0);
  const lessPartial = -ratioTimes;
  const line250 = totalDebits + lessPartial;
  const gstRate = rateFor('GST_INCOME') || 0.125;
  const gstDueBefore = gstIncome * gstRate;
  const netGstDue = gstDueBefore - line250;
  const netOf2251 = Number(workspace.value?.net_of_2251 || 0);

  return {
    gst_income: gstIncome,
    zero_rated_income: gstZero,
    exempt_income: gstExempt,
    total_value: totalValue,
    gst_income_ratio: gstIncomeRatio,
    zero_rated_ratio: 0,
    exempt_ratio: exemptRatio,
    complement_ratio: complementRatio,
    ratio_check: roundRatio(gstIncomeRatio + exemptRatio),
    partial_exemptions_total: partialTotal,
    ratio_times_partial_exemptions: ratioTimes,
    total_debits: totalDebits,
    less_partial_exemptions: lessPartial,
    line_250: line250,
    gst_rate: gstRate,
    gst_due_before_exemptions: gstDueBefore,
    invoices_less_exemptions: -line250,
    net_gst_due: netGstDue,
    net_of_2251: netOf2251,
    additional_liability: netGstDue - netOf2251,
  };
});

function periodValue(yearValue: number, monthValue: number) {
  return `${yearValue}-${String(monthValue).padStart(2, '0')}`;
}

function parsePeriod(value: string) {
  const [yearValue, monthValue] = value.split('-').map(Number);
  if (!yearValue || !monthValue) return null;
  return { year: yearValue, month: monthValue };
}

function addPeriodOption(
  items: Map<string, { label: string; value: string }>,
  yearValue: number,
  monthValue: number,
) {
  if (isFuturePeriod(yearValue, monthValue)) return;
  const value = periodValue(yearValue, monthValue);
  items.set(value, {
    label: `${monthLabel(monthValue)} ${yearValue}`,
    value,
  });
}

function isFuturePeriod(yearValue: number, monthValue: number) {
  return yearValue > currentYear || (yearValue === currentYear && monthValue > currentMonth);
}

function validateNewYear(value: number | string | null | undefined) {
  const yearValue = Number(value);
  if (!yearValue || yearValue < 2000) return 'Enter a valid year.';
  if (yearValue > currentYear) return 'Future years cannot be added.';
  return true;
}

function validateNewMonth(value: number | string | null | undefined) {
  const monthValue = Number(value);
  if (!monthValue) return 'Select a month.';
  if (isFuturePeriod(Number(newPeriodYear.value), monthValue)) {
    return 'Future months cannot be added.';
  }
  return true;
}

function addPeriod() {
  const yearValue = Number(newPeriodYear.value);
  const monthValue = Number(newPeriodMonth.value);
  const yearCheck = validateNewYear(yearValue);
  const monthCheck = validateNewMonth(monthValue);
  if (yearCheck !== true) {
    $q.notify({ color: 'negative', message: yearCheck, position: 'top' });
    return;
  }
  if (monthCheck !== true) {
    $q.notify({ color: 'negative', message: monthCheck, position: 'top' });
    return;
  }

  const exists = addedPeriods.value.some(
    (period) => period.year === yearValue && period.month === monthValue,
  );
  if (!exists) {
    addedPeriods.value.push({ year: yearValue, month: monthValue });
  }

  year.value = yearValue;
  month.value = monthValue;
  isAddPeriodOpen.value = false;
}

function monthLabel(value: number) {
  return monthOptions.find((option) => option.value === value)?.label ?? String(value);
}

function money(value: number | null | undefined) {
  return new Intl.NumberFormat('en-BZ', { style: 'currency', currency: 'BZD' }).format(Number(value ?? 0));
}

function percent(value: number | null | undefined) {
  return `${(Number(value ?? 0) * 100).toFixed(2)}%`;
}

function percentWhole(value: number | null | undefined) {
  return `${(Number(value ?? 0) * 100).toFixed(2)}%`;
}

function roundRatio(value: number) {
  return Math.round(Number(value) * 10000) / 10000;
}

function labelFor(code: string) {
  return store.rates.find((rate) => rate.code === code)?.name ?? code.replaceAll('_', ' ');
}

function lineKey(line: TaxCalculatorLine) {
  return line.account_id || `${line.row_type ?? 'account'}-${line.sort_order ?? 0}-${line.account_code ?? ''}-${line.account_name}`;
}

const GROUP_COLORS = [
  { bg: '#e3f2fd', strong: '#bbdefb' },
  { bg: '#e8f5e9', strong: '#c8e6c9' },
  { bg: '#fff3e0', strong: '#ffe0b2' },
  { bg: '#f3e5f5', strong: '#e1bee7' },
  { bg: '#e0f7fa', strong: '#b2ebf2' },
  { bg: '#fce4ec', strong: '#f8bbd0' },
  { bg: '#f1f8e9', strong: '#dcedc8' },
  { bg: '#fff8e1', strong: '#ffecb3' },
] as const;

const DEFAULT_GROUP_COLOR = GROUP_COLORS[0];

function isNetTotalLine(line: TaxCalculatorLine) {
  const name = (line.account_name ?? '').trim().toLowerCase();
  return line.row_type === 'total'
    || !!line.is_rollup
    || name.startsWith('total ')
    || name.includes('(net)');
}

function isHeading(line: TaxCalculatorLine) {
  return line.row_type === 'heading' && !isNetTotalLine(line);
}

function isAmountEditable(line: TaxCalculatorLine) {
  return !isHeading(line) && line.row_type !== 'grand_total';
}

function isTaxBaseLine(line: TaxCalculatorLine) {
  if (isHeading(line) || line.row_type === 'grand_total') {
    return false;
  }
  if (line.tax_rate_assignments?.length) {
    return true;
  }
  return line.include_in_tax !== false;
}

function lineHasAssignment(line: TaxCalculatorLine, code: string) {
  if (line.tax_rate_assignments?.length) {
    return line.tax_rate_assignments.some((assignment) => assignment.code === code);
  }
  return lineTaxCodes(line, 'business').includes(code) || lineTaxCodes(line, 'gst').includes(code);
}

function labelIndent(line: TaxCalculatorLine) {
  const column = line.label_column ?? 'B';
  if (column === 'B') return '24px';
  if (column === 'C') return '40px';
  if (column === 'D') return '56px';
  return undefined;
}

function rowClass(line: TaxCalculatorLine) {
  return {
    'text-weight-medium': isHeading(line) || line.row_type === 'total' || line.row_type === 'grand_total',
    'gst-row-heading': isHeading(line),
    'gst-row-total': line.row_type === 'total' || line.row_type === 'grand_total',
  };
}

function groupStyle(line: TaxCalculatorLine) {
  const index = Math.max(0, (line.group_index ?? 1) - 1) % GROUP_COLORS.length;
  const colors = GROUP_COLORS[index] ?? DEFAULT_GROUP_COLOR;
  const strong = isHeading(line) || line.row_type === 'total' || line.row_type === 'grand_total';
  return { backgroundColor: strong ? colors.strong : colors.bg };
}

function rateFor(code: string) {
  return store.rates.find((rate) => rate.code === code)?.rate ?? 0;
}

function formatRate(rate: number) {
  return `${(Number(rate) * 100).toFixed(2)}%`;
}

function shortTaxLabel(name: string) {
  return name
    .replace(/^Business Tax — /, 'BT ')
    .replace(/^GST — /, 'GST ')
    .replace(/^BTB /, 'BTB ');
}

function lineTaxCodes(line: TaxCalculatorLine, category: 'business' | 'gst'): string[] {
  if (category === 'business') {
    return line.business_tax_codes?.length
      ? line.business_tax_codes
      : line.business_tax_code
        ? [line.business_tax_code]
        : [];
  }

  return line.gst_codes?.length ? line.gst_codes : line.gst_code ? [line.gst_code] : [];
}

function lineApplies(line: TaxCalculatorLine, code: string) {
  if (isHeading(line)) return false;
  if (code === 'BTB_HOTEL_TAX') return line.include_btb;
  if (!lineHasAssignment(line, code)) return false;
  if (line.tax_rate_assignments?.length) {
    return true;
  }
  return line.include_in_tax !== false;
}

function isNegativeAmount(line: TaxCalculatorLine) {
  return Number(line.amount || 0) < 0;
}

function appliedTax(line: TaxCalculatorLine, code: string) {
  if (!lineApplies(line, code)) return null;
  const amount = Number(line.amount || 0);
  if (amount < 0) return null;
  return amount * rateFor(code);
}

function taxCell(line: TaxCalculatorLine, code: string) {
  const tax = appliedTax(line, code);
  return tax == null ? '—' : money(tax);
}

async function onWorkbookSelected(file: File | File[] | null) {
  const selected = Array.isArray(file) ? file[0] : file;
  if (!selected) return;
  try {
    const result = await store.importWorkbook(year.value, month.value, selected);
    const created = result.accountsSync?.created ?? 0;
    const updated = result.accountsSync?.updated ?? 0;
    const syncNote =
      created || updated
        ? ` ${created} new calculator account${created === 1 ? '' : 's'} added${updated ? `, ${updated} updated` : ''}.`
        : '';
    $q.notify({ color: 'positive', message: `Accounts/GST imported.${syncNote}`, position: 'top' });
    if (store.workspace) {
      await recalculate();
    }
  } catch (error) {
    showImportError(error, 'Import failed.');
  }
}

async function onPurchaseLedgerSelected(file: File | File[] | null) {
  const selected = Array.isArray(file) ? file[0] : file;
  if (!selected) return;
  try {
    await store.importPurchaseLedger(year.value, month.value, selected);
    if (store.workspace) {
      await recalculate();
    }
    $q.notify({ type: 'positive', message: 'Purchase ledger imported' });
  } catch (error) {
    showImportError(error, 'Purchase ledger import failed.');
  }
}

function isUploadRejected(message: string) {
  return /was not imported|not in |cannot be verified|without a class/i.test(message);
}

function showImportError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  if (isUploadRejected(message)) {
    $q.dialog({
      title: 'Upload not processed',
      message,
      persistent: true,
      ok: { unelevated: true, label: 'OK', color: 'primary', noCaps: true },
    });
    return;
  }
  $q.notify({ color: 'negative', message, position: 'top' });
}

async function load() {
  await store.fetchWorkspace(year.value, month.value);
  if (store.workspace) {
    await recalculate();
  }
}

async function recalculate() {
  if (!store.workspace) return;
  try {
    await store.preview({
      lines: store.workspace.lines,
      total_debits: Number(store.workspace.total_debits ?? store.workspace.gst_value_entered ?? 0),
      partial_exemptions_total: Number(store.workspace.partial_exemptions_total || 0),
      line_220: Number(store.workspace.line_220 ?? 0),
      net_of_2251: Number(store.workspace.net_of_2251 || 0),
    });
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error instanceof Error ? error.message : 'Could not recalculate.',
      position: 'top',
    });
  }
}

async function save() {
  if (!store.workspace) return;
  if (isFuturePeriod(year.value, month.value)) {
    $q.notify({ color: 'negative', message: 'Future periods cannot be saved.', position: 'top' });
    return;
  }
  try {
    await store.save({
      year: year.value,
      month: month.value,
      lines: store.workspace.lines,
      total_debits: Number(store.workspace.total_debits ?? store.workspace.gst_value_entered ?? 0),
      partial_exemptions_total: Number(store.workspace.partial_exemptions_total || 0),
      line_220: Number(store.workspace.line_220 || 0),
      net_of_2251: Number(store.workspace.net_of_2251 || 0),
    });
    $q.notify({ color: 'positive', message: 'Filing saved.', position: 'top' });
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error instanceof Error ? error.message : 'Save failed.',
      position: 'top',
    });
  }
}

function confirmClearAll() {
  if (!canClearData.value) return;
  $q.dialog({
    title: 'Clear all data?',
    message: `This removes the saved filing, workbook import, purchase ledger, and entered totals for ${monthLabel(month.value)} ${year.value}. This cannot be undone.`,
    cancel: { flat: true, label: 'Cancel', color: 'grey-8' },
    ok: { unelevated: true, label: 'Clear all', color: 'negative' },
    persistent: true,
  }).onOk(() => {
    void clearAll();
  });
}

async function clearAll() {
  isClearing.value = true;
  try {
    const runId = workspace.value?.run?.id;
    if (runId) {
      await store.deleteRun(runId);
    }
    await store.fetchWorkspace(year.value, month.value);
    $q.notify({ color: 'positive', message: 'Period data cleared.', position: 'top' });
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error instanceof Error ? error.message : 'Failed to clear data.',
      position: 'top',
    });
  } finally {
    isClearing.value = false;
  }
}

watch([year, month], () => {
  void load();
}, { immediate: true });

watch(isAddPeriodOpen, (open) => {
  if (!open) return;
  newPeriodYear.value = currentYear;
  newPeriodMonth.value = currentMonth;
});

watch(newPeriodYear, () => {
  const allowed = addableMonthOptions.value.map((option) => option.value);
  if (!allowed.includes(Number(newPeriodMonth.value))) {
    newPeriodMonth.value = allowed.at(-1) ?? currentMonth;
  }
});
</script>

<style scoped>
.gst-calculator {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.gst-calculator__header,
.gst-calculator__toolbar,
.gst-calculator__tabs {
  flex-shrink: 0;
}

.gst-calculator__toolbar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.gst-calculator__period {
  width: 160px;
  max-width: 100%;
  flex: 0 0 auto;
}

.gst-calculator__upload {
  width: 200px;
  max-width: 100%;
  flex: 0 0 auto;
}

.gst-calculator__toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.gst-calculator__toolbar-row :deep(.q-btn) {
  min-height: 32px;
  padding: 0 10px;
}

.gst-calculator__toolbar-row :deep(.q-field--with-bottom) {
  padding-bottom: 0;
}

.gst-calculator__body {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.gst-calculator__body > .q-separator {
  flex-shrink: 0;
}

.gst-calculator__panels {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.gst-calculator__panels :deep(.q-panel) {
  flex: 1 1 0;
  min-height: 0;
  height: auto;
  max-height: 100%;
}

.gst-accounts-panel,
.gst-results-panel,
.gst-sheet-panel,
.purchase-ledger-tab {
  min-height: 0;
}

.gst-accounts-panel,
.gst-sheet-panel,
.purchase-ledger-tab {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.gst-sheet-panel :deep(.gst-sheet-wrap) {
  flex: 1 1 0;
  min-height: 0;
}

.gst-accounts-wrap {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}

.gst-accounts-table {
  width: 100%;
}

.gst-accounts-wrap :deep(.q-markup-table) {
  overflow: visible;
}

.gst-accounts-inputs {
  flex-shrink: 0;
  padding-top: 16px;
}

.gst-results-panel {
  overflow: auto;
  overscroll-behavior: contain;
}

.q-drawer-card {
  width: 32vw;
  max-width: 460px;
  height: 100vh;
}

.gst-accounts-table tbody tr td {
  background: inherit;
}

.gst-row-heading td {
  letter-spacing: 0.01em;
}

.gst-accounts-table :deep(thead th) {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fff;
  white-space: nowrap;
}

.gst-accounts-table :deep(tfoot td) {
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: #fff;
  white-space: nowrap;
  border-top: 2px solid rgba(0, 0, 0, 0.12);
}

.gst-tax-header {
  cursor: help;
}
</style>

<template>
  <div class="td4-summary">
    <div class="text-h5 text-weight-bold q-mb-xs">TD4 Summary</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Annual return of emoluments paid and income tax withheld for posted payroll.
      The form is printed without a document header, signature, or company stamp.
    </div>

    <q-banner v-if="reportsStore.error" rounded class="bg-red-1 text-red-9 q-mb-md">
      <template #avatar><q-icon name="error_outline" /></template>
      <div class="text-weight-medium">Unable to load report</div>
      <div class="text-caption">{{ reportsStore.error }}</div>
    </q-banner>

    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-md-3">
            <q-select
              v-model="year"
              :options="yearOptions"
              outlined
              dense
              label="Year"
              :loading="reportsStore.isLoadingTd4SummaryYears"
              :disable="reportsStore.isLoadingTd4Summary || !yearOptions.length"
              :hint="yearOptions.length ? '' : 'No posted payroll years yet.'"
              @update:model-value="onYearChanged"
            />
          </div>
          <div class="col-12 col-md-3">
            <ReportHeaderSelect />
          </div>
          <div class="col-12 col-md-3">
            <q-btn
              color="primary"
              icon="assessment"
              label="Generate report"
              class="full-width"
              :loading="reportsStore.isLoadingTd4Summary"
              :disable="year == null || !yearOptions.length"
              @click="generateReport"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="report" flat bordered>
      <q-card-section>
        <div class="q-mb-md text-right">
          <q-btn
            outline
            color="primary"
            icon="table_view"
            label="Export Excel"
            class="q-mr-sm"
            @click="handleExportExcel"
          />
          <q-btn
            outline
            color="primary"
            icon="picture_as_pdf"
            label="Export PDF"
            @click="handleExportPdf"
          />
        </div>

        <article class="td4-form">
          <img class="td4-form__crest" src="/belize-coat-of-arms.png" alt="" />
          <h2>TD4 Summary</h2>
          <h3>Return of Emoluments Paid</h3>
          <div class="td4-form__year">{{ report.yearEndingLabel }}</div>

          <div class="td4-form__identity">
            <div class="td4-box td4-form__employer">
              <div class="td4-box__label">Name and Address of Employer</div>
              <div>{{ report.employerName }}</div>
              <div v-for="line in report.addressLines" :key="line">{{ line }}</div>
            </div>
            <div class="td4-box td4-form__tax">
              <div class="td4-box__label">TAX ID No.</div>
              <strong>{{ report.taxIdentificationNumber }}</strong>
            </div>
          </div>

          <table class="td4-form__amounts">
            <tbody>
              <tr>
                <td>EMOLUMENTS PAID, <span>(as shown on forms TD4 Supplementary)</span></td>
                <td class="num">{{ formatAmount(report.emolumentsPaid) }}</td>
              </tr>
              <tr>
                <td>CASUAL WAGES PAID, <span>(amount under $200 from which no tax was deducted)</span></td>
                <td class="num">{{ formatAmount(report.casualWagesPaid) }}</td>
              </tr>
              <tr>
                <td>TOTAL EMOLUMENTS PAID IN THE YEAR</td>
                <td class="num">{{ formatAmount(report.totalEmoluments) }}</td>
              </tr>
              <tr>
                <td>TOTAL INCOME TAX WITHHELD</td>
                <td class="num">{{ formatAmount(report.incomeTaxWithheld) }}</td>
              </tr>
            </tbody>
          </table>

          <div class="td4-box td4-form__certificate">
            <h3>CERTIFICATE</h3>
            <p>
              I HEREBY CERTIFY that the information given in this return, TD4 Summary and related
              TD4 Supplementary forms, is true, correct and complete.
            </p>
          </div>

          <div class="td4-form__signs">
            <div>
              <div class="td4-form__line">{{ report.generatedAt }}</div>
              <div class="td4-form__caption">Date</div>
            </div>
            <div>
              <div class="td4-form__line" />
              <div class="td4-form__caption">Signature of Authorized Person</div>
            </div>
            <div>
              <div class="td4-form__line" />
              <div class="td4-form__caption">Position or Office</div>
            </div>
          </div>

          <div class="td4-form__foot">
            <div class="td4-form__instructions">
              <p>See instructions in the "Employer's and Trustee's Tax Guide".</p>
              <p>
                Mail or deliver 1 copy of this Summary along with copies 1 and 2 of all related
                Supplementaries to the Income Tax Department or deliver to the nearest District Office.
              </p>
            </div>
            <div class="td4-box td4-form__official">
              <h3>FOR OFFICIAL USE ONLY</h3>
              <div>POST: ____________________</div>
            </div>
          </div>
        </article>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import ReportHeaderSelect from '@payroll/components/reports/ReportHeaderSelect.vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { sharedReportMonth, writeReportPeriod } from '@payroll/composables/use-report-period';
import { useReportsStore } from '@payroll/stores/reports-store';
import { exportTd4SummaryExcel, exportTd4SummaryPdf } from '@payroll/utils/td4-summary-export';

const $q = useQuasar();
const reportsStore = useReportsStore();
const { td4SummaryReport: report } = storeToRefs(reportsStore);

const shared = sharedReportMonth();
const year = ref<number | null>(shared?.year ?? null);

const yearOptions = computed(() => reportsStore.td4SummaryYears);

onMounted(() => {
  void reportsStore.fetchTd4SummaryYears().then(() => {
    const years = reportsStore.td4SummaryYears;
    if (!years.length) {
      year.value = null;
      return;
    }
    if (year.value == null || !years.includes(year.value)) {
      year.value = years[0] ?? null;
    }
  });
});

function onYearChanged(value: number | null) {
  if (value == null) {
    return;
  }
  writeReportPeriod(`${value}-01-01`, `${value}-12-31`);
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
}

function generateReport() {
  const selectedYear = year.value;
  if (selectedYear == null) {
    return;
  }
  void reportsStore.fetchTd4SummaryReport(selectedYear).then((ok) => {
    if (!ok && reportsStore.error) {
      $q.notify({ type: 'negative', message: reportsStore.error });
    }
  });
}

function handleExportExcel() {
  if (report.value) exportTd4SummaryExcel(report.value);
}

function handleExportPdf() {
  if (!report.value) return;
  void exportTd4SummaryPdf(report.value).then((opened) => {
    if (!opened) {
      $q.notify({ type: 'warning', message: 'Allow pop-ups to export the PDF.' });
    }
  });
}
</script>

<style scoped>
.td4-form {
  max-width: 860px;
  margin: 0 auto;
  color: #111;
  font-family: Arial, Helvetica, sans-serif;
}

.td4-form__crest {
  display: block;
  width: 92px;
  height: auto;
  margin: 0 auto 8px;
}

.td4-form h2,
.td4-form h3,
.td4-form__year {
  text-align: center;
  margin: 0;
}

.td4-form h2 {
  font-size: 22px;
}

.td4-form h3 {
  font-size: 16px;
}

.td4-form__year {
  margin: 4px 0 22px;
  font-weight: 700;
}

.td4-form__identity,
.td4-form__foot {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
}

.td4-box {
  border: 1.5px solid #222;
  border-radius: 16px;
  padding: 10px 16px;
}

.td4-box__label {
  font-size: 12px;
  margin-bottom: 6px;
}

.td4-form__employer {
  width: 62%;
  min-height: 92px;
}

.td4-form__tax {
  width: 180px;
  text-align: center;
}

.td4-form__tax strong {
  display: block;
  margin-top: 8px;
  letter-spacing: 0.04em;
}

.td4-form__amounts {
  width: 100%;
  border-collapse: collapse;
  margin: 28px 0;
}

.td4-form__amounts td {
  padding: 7px 0;
  font-weight: 700;
}

.td4-form__amounts span {
  font-weight: 400;
}

.td4-form__amounts .num {
  text-align: right;
  width: 180px;
  font-variant-numeric: tabular-nums;
}

.td4-form__certificate {
  min-height: 120px;
}

.td4-form__certificate h3 {
  margin: 8px 0 18px;
}

.td4-form__certificate p {
  margin: 0 8px 12px;
  line-height: 1.45;
  font-weight: 400;
}

.td4-form__signs {
  display: grid;
  grid-template-columns: 1fr 1.3fr 1fr;
  gap: 28px;
  margin-top: 28px;
}

.td4-form__line {
  border-bottom: 1px solid #222;
  min-height: 28px;
  text-align: center;
}

.td4-form__caption {
  text-align: center;
  font-size: 12px;
  margin-top: 4px;
}

.td4-form__foot {
  margin-top: 28px;
}

.td4-form__instructions {
  max-width: 460px;
  font-size: 13px;
  line-height: 1.4;
}

.td4-form__official {
  width: 250px;
  min-height: 110px;
}

.td4-form__official h3 {
  margin: 4px 0 28px;
  font-size: 14px;
}
</style>

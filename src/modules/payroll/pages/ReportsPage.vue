<template>
  <q-page class="reports-page column no-wrap">
    <div class="reports-page__layout">
      <aside class="reports-page__drawer">
        <div class="reports-page__drawer-header text-subtitle1 text-weight-bold">
          Reports
        </div>
        <q-list padding>
          <q-item
            v-for="report in REPORT_OPTIONS"
            :key="report.id"
            clickable
            v-ripple
            :active="selectedReportId === report.id"
            active-class="bg-primary text-white"
            :to="reportPath(report.id)"
          >
            <q-item-section avatar>
              <q-icon :name="report.icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ report.label }}</q-item-label>
              <q-item-label caption :class="{ 'text-blue-1': selectedReportId === report.id }">
                {{ report.caption }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </aside>

      <section
        class="reports-page__content q-pa-md"
        :class="{ 'reports-page__content--fill': selectedReportId === 'gst-calculator' }"
      >
        <JournalEntriesReport v-if="selectedReportId === 'journal-entries'" />
          <SalaryReviewReport v-else-if="selectedReportId === 'salary-review'" />
          <PayrollSummaryByDepartmentReport v-else-if="selectedReportId === 'payroll-summary-by-department'" />
          <PayrollJournalDepartmentsReport v-else-if="selectedReportId === 'payroll-journal-departments'" />
          <ScheduledVsWorkedHoursReport v-else-if="selectedReportId === 'scheduled-vs-worked-hours'" />
          <PayeEmploymentDetailsReport v-else-if="selectedReportId === 'paye-employment-details'" />
          <SocialSecurityPaymentsByMonthReport v-else-if="selectedReportId === 'social-security-payments-by-month'" />
          <BankUploadReport v-else-if="selectedReportId === 'bank-upload'" />
          <GstCalculatorReport v-else-if="selectedReportId === 'gst-calculator'" />
        <div v-else class="text-body1 text-grey-7">
          Select a report from the list.
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import JournalEntriesReport from '@payroll/components/reports/JournalEntriesReport.vue';
import PayrollJournalDepartmentsReport from '@payroll/components/reports/PayrollJournalDepartmentsReport.vue';
import ScheduledVsWorkedHoursReport from '@payroll/components/reports/ScheduledVsWorkedHoursReport.vue';
import PayrollSummaryByDepartmentReport from '@payroll/components/reports/PayrollSummaryByDepartmentReport.vue';
import SalaryReviewReport from '@payroll/components/reports/SalaryReviewReport.vue';
import PayeEmploymentDetailsReport from '@payroll/components/reports/PayeEmploymentDetailsReport.vue';
import SocialSecurityPaymentsByMonthReport from '@payroll/components/reports/SocialSecurityPaymentsByMonthReport.vue';
import BankUploadReport from '@payroll/components/reports/BankUploadReport.vue';
import GstCalculatorReport from '@payroll/components/reports/GstCalculatorReport.vue';
import {
  DEFAULT_REPORT_ID,
  isReportId,
  REPORT_OPTIONS,
  reportPath,
  type ReportId,
} from '@payroll/config/report-routes';

const props = defineProps<{
  reportId?: string;
}>();

const route = useRoute();
const router = useRouter();

const selectedReportId = computed<ReportId>(() => {
  const fromRoute = props.reportId ?? (route.params.reportId as string | undefined);
  return isReportId(fromRoute) ? fromRoute : DEFAULT_REPORT_ID;
});

if (!isReportId(props.reportId ?? (route.params.reportId as string | undefined))) {
  void router.replace(reportPath(DEFAULT_REPORT_ID));
}
</script>

<style scoped>
.reports-page {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.reports-page__layout {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.reports-page__drawer {
  width: 280px;
  flex-shrink: 0;
  height: 100%;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  background: #fff;
  overflow-y: auto;
}

.reports-page__drawer-header {
  padding: 20px 16px 8px;
}

.reports-page__content {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
}

.reports-page__content--fill {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@media (max-width: 767px) {
  .reports-page__layout {
    flex-direction: column;
  }

  .reports-page__drawer {
    width: 100%;
    height: auto;
    max-height: 40%;
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  }
}
</style>

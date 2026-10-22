<template>
  <q-page class="reports-page column no-wrap">
    <div class="reports-page__layout">
      <section
        class="reports-page__content q-pa-md"
        :class="{ 'reports-page__content--fill': isGstCalculator }"
      >
        <component :is="activeReportComponent" v-if="activeReportComponent" />
        <div v-else class="text-body1 text-grey-7">
          Select a report from the list.
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import JournalEntriesReport from '@payroll/components/reports/JournalEntriesReport.vue';
import PayrollSummaryByDepartmentReport from '@payroll/components/reports/PayrollSummaryByDepartmentReport.vue';
import PayrollJournalDepartmentsReport from '@payroll/components/reports/PayrollJournalDepartmentsReport.vue';
import ScheduledVsWorkedHoursReport from '@payroll/components/reports/ScheduledVsWorkedHoursReport.vue';
import LaborCostToDateReport from '@payroll/components/reports/LaborCostToDateReport.vue';
import DepartmentHoursAndPayReport from '@payroll/components/reports/DepartmentHoursAndPayReport.vue';
import CompanyPayrollAnalysisByDepartmentReport from '@payroll/components/reports/CompanyPayrollAnalysisByDepartmentReport.vue';
import PayrollMasterSheetReport from '@payroll/components/reports/PayrollMasterSheetReport.vue';
import SalaryPaymentsReport from '@payroll/components/reports/SalaryPaymentsReport.vue';
import PoolPayoutsReport from '@payroll/components/reports/PoolPayoutsReport.vue';
import PayrollRegistryReport from '@payroll/components/reports/PayrollRegistryReport.vue';
import RegistrySummaryByOfficeDepartmentReport from '@payroll/components/reports/RegistrySummaryByOfficeDepartmentReport.vue';
import PayeReport from '@payroll/components/reports/PayeReport.vue';
import Td4SummaryReport from '@payroll/components/reports/Td4SummaryReport.vue';
import Td4SupplementaryReport from '@payroll/components/reports/Td4SupplementaryReport.vue';
import EmolumentsWithheldTaxReport from '@payroll/components/reports/EmolumentsWithheldTaxReport.vue';
import SocialSecurityContributionsReport from '@payroll/components/reports/SocialSecurityContributionsReport.vue';
import SocialSecurityDeductionReport from '@payroll/components/reports/SocialSecurityDeductionReport.vue';
import SalaryReviewReport from '@payroll/components/reports/SalaryReviewReport.vue';
import PayeEmploymentDetailsReport from '@payroll/components/reports/PayeEmploymentDetailsReport.vue';
import PayeReconciliationEmployeeDetailsReport from '@payroll/components/reports/PayeReconciliationEmployeeDetailsReport.vue';
import SocialSecurityPaymentsByMonthReport from '@payroll/components/reports/SocialSecurityPaymentsByMonthReport.vue';
import BankUploadReport from '@payroll/components/reports/BankUploadReport.vue';
import GstCalculatorReport from '@payroll/components/reports/GstCalculatorReport.vue';
import {
  DEFAULT_REPORT_ID,
  isReportId,
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

const reportComponents: Record<ReportId, Component> = {
  'journal-entries': JournalEntriesReport,
  'salary-review': SalaryReviewReport,
  'payroll-summary-by-department': PayrollSummaryByDepartmentReport,
  'payroll-journal-departments': PayrollJournalDepartmentsReport,
  'scheduled-vs-worked-hours': ScheduledVsWorkedHoursReport,
  'labor-cost-to-date': LaborCostToDateReport,
  'department-hours-and-pay': DepartmentHoursAndPayReport,
  'company-payroll-analysis-by-department': CompanyPayrollAnalysisByDepartmentReport,
  'payroll-master-sheet': PayrollMasterSheetReport,
  'salary-payments': SalaryPaymentsReport,
  'pool-payouts': PoolPayoutsReport,
  'payroll-registry': PayrollRegistryReport,
  'registry-summary-by-office-department': RegistrySummaryByOfficeDepartmentReport,
  'paye': PayeReport,
  'td4-summary': Td4SummaryReport,
  'td4-supplementary': Td4SupplementaryReport,
  'emoluments-withheld-tax': EmolumentsWithheldTaxReport,
  'social-security-contributions': SocialSecurityContributionsReport,
  'social-security-deduction': SocialSecurityDeductionReport,
  'paye-employment-details': PayeEmploymentDetailsReport,
  'paye-reconciliation-employee-details': PayeReconciliationEmployeeDetailsReport,
  'social-security-payments-by-month': SocialSecurityPaymentsByMonthReport,
  'bank-upload': BankUploadReport,
  'gst-calculator': GstCalculatorReport,
};

const activeReportComponent = computed(() => reportComponents[selectedReportId.value]);

const isGstCalculator = computed(() => selectedReportId.value === 'gst-calculator');

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

.reports-page__content--fill > :deep(.gst-calculator) {
  flex: 1 1 0;
  min-height: 0;
}

</style>

<template>
  <q-page class="reports-page">
    <div class="reports-page__layout">
      <aside class="reports-page__drawer">
        <div class="reports-page__drawer-header text-subtitle1 text-weight-bold">
          Reports
        </div>
        <q-list padding>
          <q-item
            v-for="report in reportOptions"
            :key="report.id"
            clickable
            v-ripple
            :active="selectedReportId === report.id"
            active-class="bg-primary text-white"
            @click="selectedReportId = report.id"
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

      <section class="reports-page__content q-pa-md">
        <JournalEntriesReport v-if="selectedReportId === 'journal-entries'" />
        <SalaryReviewReport v-else-if="selectedReportId === 'salary-review'" />
        <PayrollSummaryByDepartmentReport v-else-if="selectedReportId === 'payroll-summary-by-department'" />
        <PayrollJournalDepartmentsReport v-else-if="selectedReportId === 'payroll-journal-departments'" />
        <ScheduledVsWorkedHoursReport v-else-if="selectedReportId === 'scheduled-vs-worked-hours'" />
        <PayeEmploymentDetailsReport v-else-if="selectedReportId === 'paye-employment-details'" />
        <SocialSecurityPaymentsByMonthReport v-else-if="selectedReportId === 'social-security-payments-by-month'" />
        <BankUploadReport v-else-if="selectedReportId === 'bank-upload'" />
        <div v-else class="text-body1 text-grey-7">
          Select a report from the list.
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import JournalEntriesReport from '@payroll/components/reports/JournalEntriesReport.vue';
import PayrollJournalDepartmentsReport from '@payroll/components/reports/PayrollJournalDepartmentsReport.vue';
import ScheduledVsWorkedHoursReport from '@payroll/components/reports/ScheduledVsWorkedHoursReport.vue';
import PayrollSummaryByDepartmentReport from '@payroll/components/reports/PayrollSummaryByDepartmentReport.vue';
import SalaryReviewReport from '@payroll/components/reports/SalaryReviewReport.vue';
import PayeEmploymentDetailsReport from '@payroll/components/reports/PayeEmploymentDetailsReport.vue';
import SocialSecurityPaymentsByMonthReport from '@payroll/components/reports/SocialSecurityPaymentsByMonthReport.vue';
import BankUploadReport from '@payroll/components/reports/BankUploadReport.vue';

type ReportId =
  | 'journal-entries'
  | 'salary-review'
  | 'payroll-summary-by-department'
  | 'payroll-journal-departments'
  | 'scheduled-vs-worked-hours'
  | 'paye-employment-details'
  | 'social-security-payments-by-month'
  | 'bank-upload';

const selectedReportId = ref<ReportId>('journal-entries');

const reportOptions = [
  {
    id: 'journal-entries' as const,
    label: 'Journal Entries',
    caption: 'Payroll GL lines by account',
    icon: 'menu_book',
  },
  {
    id: 'salary-review' as const,
    label: 'Salary Review',
    caption: 'Employee pay by department and account',
    icon: 'payments',
  },
  {
    id: 'payroll-summary-by-department' as const,
    label: 'Payroll Summary by Department',
    caption: 'Hours and pay rollup by department',
    icon: 'summarize',
  },
  {
    id: 'payroll-journal-departments' as const,
    label: 'Payroll Journal Departments',
    caption: 'Department payroll journal by employee',
    icon: 'receipt_long',
  },
  {
    id: 'scheduled-vs-worked-hours' as const,
    label: 'Scheduled vs Worked Hours',
    caption: 'Scheduled/worked, OT, tips, shares, specials',
    icon: 'query_stats',
  },
  {
    id: 'paye-employment-details' as const,
    label: 'PAYE Employment Details',
    caption: 'Belize Tax Services PAYE upload workbook',
    icon: 'account_balance',
  },
  {
    id: 'social-security-payments-by-month' as const,
    label: 'Social Security Payments by Month',
    caption: 'Weekly SS filing rows by Monday',
    icon: 'health_and_safety',
  },
  {
    id: 'bank-upload' as const,
    label: 'Generate Bank Upload',
    caption: 'Salary deposit CSV for posted payroll',
    icon: 'account_balance_wallet',
  },
];
</script>

<style scoped>
.reports-page {
  height: calc(100vh - 64px);
  overflow: hidden;
}

.reports-page__layout {
  display: flex;
  min-height: inherit;
}

.reports-page__drawer {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  align-self: flex-start;
  height: 100%;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  background: #fff;
  overflow-y: auto;
}

.reports-page__drawer-header {
  padding: 20px 16px 8px;
}

.reports-page__content {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
}

@media (max-width: 767px) {
  .reports-page {
    height: auto;
    overflow: visible;
  }

  .reports-page__layout {
    flex-direction: column;
  }

  .reports-page__drawer {
    position: static;
    height: auto;
    overflow: visible;
    width: 100%;
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  }

  .reports-page__content {
    height: auto;
    overflow: visible;
  }
}
</style>

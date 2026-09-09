<template>
  <div class="reports-left-pane">
    <div class="reports-left-pane__header text-subtitle1 text-weight-bold">
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  DEFAULT_REPORT_ID,
  isReportId,
  REPORT_OPTIONS,
  reportPath,
  type ReportId,
} from '@payroll/config/report-routes';

const route = useRoute();

const selectedReportId = computed<ReportId>(() => {
  const fromRoute = route.params.reportId as string | undefined;
  return isReportId(fromRoute) ? fromRoute : DEFAULT_REPORT_ID;
});
</script>

<style scoped>
.reports-left-pane__header {
  padding: 20px 16px 8px;
}
</style>

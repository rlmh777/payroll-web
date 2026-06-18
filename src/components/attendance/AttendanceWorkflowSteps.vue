<template>
  <q-card flat bordered class="workflow-card q-mb-md">
    <q-card-section class="q-pa-sm">
      <div class="row q-col-gutter-sm">
        <div v-for="(step, index) in steps" :key="step.name" class="col-12 col-md-4">
          <q-btn
            :to="step.to"
            no-caps
            align="left"
            flat
            class="workflow-step full-width"
            :class="{ 'workflow-step--active': props.activeTab === step.name }"
          >
            <div class="row items-center no-wrap full-width q-gutter-md">
              <q-avatar
                :color="props.activeTab === step.name ? 'primary' : 'grey-2'"
                :text-color="props.activeTab === step.name ? 'white' : 'grey-8'"
                size="36px"
              >
                {{ index + 1 }}
              </q-avatar>
              <div class="text-left col">
                <div class="row items-center q-gutter-sm">
                  <div class="text-weight-medium">{{ step.label }}</div>
                  <q-badge
                    v-if="stepBadge(step.name)"
                    rounded
                    :color="stepBadge(step.name)?.color"
                    :label="stepBadge(step.name)?.label"
                  />
                </div>
                <div class="text-caption text-grey-7">{{ step.description }}</div>
              </div>
              <q-space />
              <q-icon name="chevron_right" color="grey-6" />
            </div>
          </q-btn>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { AttendanceTab } from './types';

const props = defineProps<{
  activeTab: AttendanceTab;
  importComplete: boolean;
  generatedCount: number;
  pendingCount: number;
  issueCount: number;
}>();

const steps: Array<{
  name: AttendanceTab;
  label: string;
  description: string;
  to: string;
}> = [
  {
    name: 'import',
    label: 'Import attendance',
    description: 'Upload and validate biometric records.',
    to: '/payroll/clocking-import',
  },
  {
    name: 'logs',
    label: 'Generate timesheets',
    description: 'Apply punches, schedules, regular time, and OT.',
    to: '/payroll/clocking-logs',
  },
  {
    name: 'timesheets',
    label: 'Review for payroll',
    description: 'Resolve exceptions and approve clean records.',
    to: '/payroll/timesheets',
  },
];

function stepBadge(name: AttendanceTab) {
  if (name === 'import' && props.importComplete) {
    return { label: 'Imported', color: 'positive' };
  }

  if (name === 'logs' && props.generatedCount > 0) {
    return { label: `${props.generatedCount} generated`, color: 'positive' };
  }

  if (name === 'timesheets' && props.issueCount > 0) {
    return { label: `${props.issueCount} exceptions`, color: 'warning' };
  }

  if (name === 'timesheets' && props.pendingCount > 0) {
    return { label: `${props.pendingCount} pending`, color: 'primary' };
  }

  return null;
}
</script>

<style scoped>
.workflow-card {
  border-radius: 12px;
  background: #fff;
}

.workflow-step {
  min-height: 68px;
  border: 1px solid transparent;
  border-radius: 10px;
}

.workflow-step--active {
  border-color: #b9d6fb;
  background: #f2f7fe;
}
</style>

<template>
  <q-card flat bordered class="attendance-metric-card full-height">
    <q-card-section class="row items-center no-wrap q-gutter-md">
      <q-avatar :color="toneStyles.avatar" :text-color="toneStyles.text" size="42px">
        <q-icon :name="props.icon" size="22px" />
      </q-avatar>
      <div class="col">
        <div class="text-caption text-grey-7">{{ props.label }}</div>
        <div class="row items-end q-gutter-sm metric-values">
          <div>
            <div class="text-caption text-grey-6">Current</div>
            <div class="text-h6 text-weight-bold metric-value">{{ props.value }}</div>
          </div>
          <div class="metric-previous">
            <div class="text-caption text-grey-6">Previous</div>
            <div class="text-subtitle2 text-weight-medium">{{ props.previousValue ?? '—' }}</div>
          </div>
        </div>
        <div v-if="props.caption" class="text-caption text-grey-6 q-mt-xs">{{ props.caption }}</div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type MetricTone = 'primary' | 'positive' | 'warning' | 'negative' | 'neutral' | 'teal';

const props = withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    icon: string;
    caption?: string | undefined;
    previousValue?: string | number | undefined;
    tone?: MetricTone | undefined;
  }>(),
  {
    tone: 'primary',
  },
);

const toneStyles = computed(() => {
  const styles: Record<MetricTone, { avatar: string; text: string }> = {
    primary: { avatar: 'blue-1', text: 'primary' },
    positive: { avatar: 'green-1', text: 'positive' },
    warning: { avatar: 'orange-1', text: 'orange-9' },
    negative: { avatar: 'red-1', text: 'negative' },
    neutral: { avatar: 'grey-2', text: 'grey-8' },
    teal: { avatar: 'teal-1', text: 'teal-8' },
  };

  return styles[props.tone];
});
</script>

<style scoped>
.attendance-metric-card {
  border-radius: 12px;
  background: #fff;
}

.metric-value {
  line-height: 1.2;
}

.metric-values {
  flex-wrap: wrap;
}

.metric-previous {
  color: #52606d;
}
</style>

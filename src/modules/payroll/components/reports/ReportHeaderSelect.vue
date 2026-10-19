<template>
  <q-select
    v-model="selectedId"
    :options="options"
    outlined
    dense
    emit-value
    map-options
    option-value="value"
    option-label="label"
    label="Document header"
    :loading="headerStore.isLoading"
    :disable="headerStore.isLoading"
    :menu-offset="[0, 4]"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useDocumentHeaderStore } from '@payroll/stores/document-header-store';
import { NONE_HEADER_ID, REPORTS_DEFAULT_NONE } from '@payroll/utils/document-header';

const props = defineProps<{
  reportId?: string;
}>();

const route = useRoute();
const headerStore = useDocumentHeaderStore();
const reportId = computed(() => {
  if (props.reportId) {
    return props.reportId;
  }
  const fromRoute = route.params.reportId;
  return typeof fromRoute === 'string' ? fromRoute : '';
});

const options = computed(() => [
  { label: 'None', value: NONE_HEADER_ID },
  ...headerStore.headers.map((header) => ({
    label: header.name,
    value: header.id,
  })),
]);

const selectedId = computed({
  get(): string {
    const stored = headerStore.selections[reportId.value];
    if (stored === NONE_HEADER_ID) {
      return NONE_HEADER_ID;
    }
    if (stored && headerStore.headers.some((header) => header.id === stored)) {
      return stored;
    }
    if (REPORTS_DEFAULT_NONE.has(reportId.value)) {
      return NONE_HEADER_ID;
    }
    return headerStore.activeHeader?.id ?? NONE_HEADER_ID;
  },
  set(headerId: string | { value?: string } | null) {
    const id = typeof headerId === 'string'
      ? headerId
      : headerId?.value || NONE_HEADER_ID;
    headerStore.selectHeader(reportId.value, id || NONE_HEADER_ID);
  },
});

watch(reportId, (id) => {
  if (id) {
    headerStore.setActiveReport(id);
  }
}, { immediate: true });

onMounted(() => {
  if (!headerStore.headers.length) {
    void headerStore.fetchHeaders();
  }
});
</script>

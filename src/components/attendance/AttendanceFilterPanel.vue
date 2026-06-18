<template>
  <q-card flat bordered class="attendance-filter-panel">
    <q-expansion-item :default-opened="props.defaultOpened" expand-separator>
      <template #header>
        <q-item-section avatar>
          <q-avatar color="blue-1" text-color="primary" icon="filter_list" size="36px" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">{{ props.title }}</q-item-label>
          <q-item-label caption>{{ props.description || 'Open filters for additional review options.' }}</q-item-label>
        </q-item-section>
        <q-item-section v-if="props.activeFilterCount" side>
          <q-badge color="primary" rounded>{{ props.activeFilterCount }} active</q-badge>
        </q-item-section>
      </template>

      <q-card-section>
        <div class="row q-col-gutter-md items-start">
          <slot />
        </div>

        <div v-if="$slots.actions" class="row justify-end q-gutter-sm q-mt-md">
          <slot name="actions" />
        </div>
      </q-card-section>
    </q-expansion-item>
  </q-card>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    activeFilterCount?: number;
    defaultOpened?: boolean;
  }>(),
  {
    title: 'Filters',
    description: '',
    activeFilterCount: 0,
    defaultOpened: false,
  },
);
</script>

<style scoped>
.attendance-filter-panel {
  border-radius: 12px;
  background: #fff;
}
</style>

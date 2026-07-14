<template>
  <q-btn-dropdown
    flat
    dense
    no-caps
    icon="view_column"
    label="Columns"
    class="timesheet-column-picker"
  >
    <q-list dense class="timesheet-column-picker-list">
      <q-item-label header>Show columns</q-item-label>
      <q-item
        v-for="column in toggleableColumns"
        :key="column.name"
        clickable
        @click="toggleColumn(column.name)"
      >
        <q-item-section avatar>
          <q-checkbox
            dense
            :model-value="isColumnVisible(column.name)"
            @update:model-value="setColumnVisible(column.name, $event)"
            @click.stop
          />
        </q-item-section>
        <q-item-section>{{ column.label }}</q-item-section>
      </q-item>
      <q-separator />
      <q-item clickable @click="resetColumns">
        <q-item-section avatar>
          <q-icon name="restart_alt" size="20px" />
        </q-item-section>
        <q-item-section>Reset to default</q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useTimesheetStore } from '@hr/stores/timesheet-store';
import { TIMESHEET_TABLE_COLUMNS } from '@hr/utils/timesheet-table-columns';

const timesheetStore = useTimesheetStore();
const { visibleTableColumns } = storeToRefs(timesheetStore);

const toggleableColumns = computed(() =>
  TIMESHEET_TABLE_COLUMNS.filter(
    (column): column is typeof column & { name: string } => Boolean(column.name) && column.name !== 'actions',
  ),
);

function isColumnVisible(name: string) {
  return visibleTableColumns.value.includes(name);
}

function setColumnVisible(name: string, visible: boolean) {
  if (!name) {
    return;
  }

  if (!visible) {
    const visibleToggleable = visibleTableColumns.value.filter((columnName) => columnName !== 'actions');
    if (visibleToggleable.length === 1 && visibleToggleable[0] === name) {
      return;
    }
  }

  const withoutTarget = visibleTableColumns.value.filter((columnName) => columnName !== name);
  const next = visible ? [...withoutTarget, name] : withoutTarget;

  timesheetStore.setVisibleColumnNames(next);
}

function toggleColumn(name: string) {
  setColumnVisible(name, !isColumnVisible(name));
}

function resetColumns() {
  timesheetStore.resetVisibleColumns();
}
</script>

<style scoped>
.timesheet-column-picker-list {
  min-width: 260px;
  max-height: 420px;
  overflow-y: auto;
}
</style>

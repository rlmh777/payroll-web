<template>
  <div class="left-pane-container">
    <div class="fixed-search">
      <MiniSearchEmployeeComponent />
    </div>
    <div class="scrollable-list">
      <q-inner-loading :showing="employeeStore.isLoading && employeeStore.employees.length === 0">
        <q-spinner color="primary" size="32px" />
        <div class="employee-pane-loading-label">Loading employees…</div>
      </q-inner-loading>

      <EmployeeList />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEmployeeStore } from '@/stores/employee-store';
import EmployeeList from './EmployeeList.vue';
import { employeePath, pathInModule } from '@core/config/module-routes';

const route = useRoute();
const router = useRouter();
const employeeStore = useEmployeeStore();

function isEmployeeRoute(path: string) {
  return pathInModule(path, 'employees');
}

function isEmployeesIndexRoute() {
  return route.name === 'employees';
}

function isCreateOrImportRoute() {
  return route.name === 'employees-new'
    || route.name === 'employees-import'
    || route.path === `${employeePath()}/new`
    || route.path === `${employeePath()}/import`;
}

function selectFirstEmployeeIfNeeded() {
  if (!isEmployeesIndexRoute() || isCreateOrImportRoute()) {
    return;
  }

  const firstEmployee = employeeStore.employees[0];
  if (!firstEmployee?.id) {
    return;
  }

  void router.replace(employeePath(firstEmployee.id));
}

async function loadEmployeesForRoute(enteringFromAnotherMenu: boolean) {
  await employeeStore.ensureEmployeesLoaded({
    resetSearch: enteringFromAnotherMenu,
  });
  selectFirstEmployeeIfNeeded();
}

watch(
  () => route.path,
  (path, previousPath) => {
    if (!isEmployeeRoute(path)) {
      return;
    }

    const enteringFromAnotherMenu = Boolean(previousPath && !isEmployeeRoute(previousPath));
    void loadEmployeesForRoute(enteringFromAnotherMenu);
  },
  { immediate: true },
);
</script>

<style scoped>
.left-pane-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.fixed-search {
  flex-shrink: 0;
  z-index: 1;
}

.scrollable-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  min-height: 120px;
}

.employee-pane-loading-label {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
  text-align: center;
}
</style>

<template>
  <div class="q-px-md q-pt-sm breadcrumb-wrap">
    <q-breadcrumbs>
      <q-breadcrumbs-el
        v-for="crumb in breadcrumbs"
        :key="crumb.path"
        :label="crumb.label"
        :to="crumb.path"
      />
    </q-breadcrumbs>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useMenuStore, type MenuItem } from 'src/stores/menus';
import { useEmployeeStore } from '@hr/stores/employee-store';
import type { Employee } from '@core/types/models';

const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const route = useRoute();
const menuStore = useMenuStore();
const employeeStore = useEmployeeStore();

onMounted(async () => {
  if (!menuStore.menuTree?.length) {
    await menuStore.fetchMenus();
  }
});

function flattenMenus(items: MenuItem[], list: MenuItem[] = []): MenuItem[] {
  items.forEach((item) => {
    list.push(item);
    if (item.children?.length) {
      flattenMenus(item.children, list);
    }
  });
  return list;
}

function employeeDisplayName(employee: Employee | null | undefined): string | null {
  if (!employee) return null;

  const fromPerson = [
    employee.person?.firstName,
    employee.person?.middleName,
    employee.person?.lastName,
  ].filter(Boolean).join(' ').trim();

  if (fromPerson) return fromPerson;

  const fromEmployee = [employee.firstName, employee.middleName, employee.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fromEmployee || null;
}

function resolveEmployeeLabel(employeeId: string): string | null {
  if (employeeStore.selectedEmployee?.id === employeeId) {
    return employeeDisplayName(employeeStore.selectedEmployee);
  }

  const fromList = employeeStore.employees.find((employee) => employee.id === employeeId);
  return employeeDisplayName(fromList);
}

function isEmployeeRouteSegment(parentPath: string, segment: string): boolean {
  if (!UUID_SEGMENT.test(segment)) return false;
  return parentPath === '/employees' || parentPath === '/employee';
}

function formatSegmentLabel(segment: string): string {
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

const breadcrumbs = computed(() => {
  const segments = route.path.split('/').filter(Boolean);
  const crumbs: Array<{ label: string; path: string }> = [];
  let currentPath = '';
  const menuItems = menuStore.menuTree ? flattenMenus(menuStore.menuTree) : [];

  segments.forEach((segment) => {
    const parentPath = currentPath;
    currentPath += `/${segment}`;
    const menuMatch = menuItems.find((item) => item.route === currentPath);

    let label = menuMatch?.title ?? formatSegmentLabel(segment);
    if (isEmployeeRouteSegment(parentPath, segment)) {
      label = resolveEmployeeLabel(segment) ?? label;
    }

    crumbs.push({ label, path: currentPath });
  });

  return crumbs;
});
</script>

<style scoped>
.breadcrumb-wrap {
  min-height: 32px;
}
</style>

<template>
  <div class="employee-list-container">
    <div class="row q-gutter-md">
      <div v-for="employee in employees" :key="employee.id" class="col-12">
        <q-card
          class="employee-card"
          :class="{ 'employee-card-selected': isEmployeeSelected(employee.id) }"
          @click="navigateToEmployee(employee.id)"
        >
          <div class="employee-card-header">
            <GenderIcon :gender="employee.gender ?? null" />
          </div>

          <q-card-section class="employee-info-section">
            <div class="row items-center">
              <q-avatar
                :style="{ backgroundColor: getAvatarColor(employee.lastName) }"
                text-color="white"
                size="48px"
                class="q-mr-md"
                font-size="20px"
              >
                {{ getInitial(employee.lastName) }}
              </q-avatar>
              <div class="col">
                <div class="text-h6 text-weight-medium q-mb-xs">
                  {{ employee.lastName }}, {{ employee.firstName }}
                </div>
                <div class="text-caption text-grey-7">
                  <span class="copyable-field-container">
                    <span>{{ employee.code }}</span>
                    <q-icon
                      name="content_copy"
                      size="14px"
                      class="copy-icon"
                      @click.stop="copyToClipboard(employee.code, 'Code')"
                    />
                  </span>
                  <span class="q-mx-xs">•</span>
                  <span class="copyable-field-container">
                    <span>{{ employee.socialSecurityNumber }}</span>
                    <q-icon
                      name="content_copy"
                      size="14px"
                      class="copy-icon"
                      @click.stop="
                        copyToClipboard(employee.socialSecurityNumber, 'Social Security Number')
                      "
                    />
                  </span>
                </div>
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="employee-details-section">
            <div class="row items-center q-mb-sm q-gutter-md">
              <div class="col items-center row">
                <div class="col-auto q-mr-sm">
                  <q-icon name="badge" size="20px" color="grey-7" />
                </div>
                <div v-if="employee.taxIdentificationNumber" class="col copyable-field-container">
                  <span>{{ employee.taxIdentificationNumber }}</span>
                  <q-icon
                    name="content_copy"
                    size="14px"
                    class="copy-icon"
                    @click.stop="copyToClipboard(employee.taxIdentificationNumber, 'TIN')"
                  />
                </div>
                <div v-else class="col">N/A</div>
              </div>
              <div class="col items-center row">
                <div class="col-auto q-mr-sm">
                  <q-icon name="phone" size="20px" color="grey-7" />
                </div>
                <div v-if="employee.phone" class="col copyable-field-container">
                  <span>{{ employee.phone }}</span>
                  <q-icon
                    name="content_copy"
                    size="14px"
                    class="copy-icon"
                    @click.stop="copyToClipboard(employee.phone, 'Phone')"
                  />
                </div>
                <div v-else class="col">N/A</div>
              </div>
            </div>
            <div class="row items-center">
              <div class="col-auto q-mr-sm">
                <q-icon name="email" size="20px" color="grey-7" />
              </div>
              <div v-if="employee.email" class="col copyable-field-container">
                <span>{{ employee.email }}</span>
                <q-icon
                  name="content_copy"
                  size="14px"
                  class="copy-icon"
                  @click.stop="copyToClipboard(employee.email, 'Email')"
                />
              </div>
              <div v-else class="col">N/A</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-infinite-scroll @load="loadMore" :offset="250" :disable="isInfiniteScrollDisabled">
      <template v-slot:loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots color="primary" size="40px" />
        </div>
      </template>
    </q-infinite-scroll>

    <div
      v-if="!employeeStore.isLoading && employees.length === 0"
      class="row justify-center q-my-md"
    >
      <div class="text-caption text-grey-6">No employees found</div>
    </div>

    <div v-if="!hasMore && employees.length > 0" class="row justify-center q-my-md">
      <div class="text-caption text-grey-6">No more employees to load</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEmployeeStore } from '@/stores/employee-store';
import { computed, watch, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter, useRoute } from 'vue-router';
import { employeePath } from '@core/config/module-routes';
import GenderIcon from './GenderIcon.vue';

const employeeStore = useEmployeeStore();
const $q = useQuasar();
const router = useRouter();
const route = useRoute();

const isInitialLoad = ref(true);

watch(
  () => employeeStore.isLoading,
  (loading, wasLoading) => {
    if (wasLoading && !loading) {
      isInitialLoad.value = false;
    }
  },
);

watch(
  () => employeeStore.employees.length,
  (length) => {
    if (length > 0) {
      isInitialLoad.value = false;
    }
  },
  { immediate: true },
);

const employees = computed(() => employeeStore.employees);
const hasMore = computed(() => employeeStore.hasMore);
const isLoading = computed(() => employeeStore.isLoading);
const isInfiniteScrollDisabled = computed(
  () => !hasMore.value || isLoading.value || isInitialLoad.value,
);

// Watch for search/filter changes and reset (only after initial load)
watch(
  () => [
    employeeStore.searchName,
    employeeStore.filterEmployeeStatusIds.join(','),
    employeeStore.filterDepartmentId,
    employeeStore.sortBy,
    employeeStore.sortDirection,
  ],
  async () => {
    // Only trigger if not initial load
    if (!isInitialLoad.value) {
      await employeeStore.fetchEmployees(true);
    }
  },
);

const loadMore = async (index: number, done: (stop?: boolean) => void) => {
  // Prevent loading if already loading or no more data
  if (employeeStore.isLoading || !employeeStore.hasMore) {
    done(true);
    return;
  }

  try {
    await employeeStore.loadMoreEmployees();
    done(!employeeStore.hasMore);
  } catch (error) {
    console.error('Failed to load more employees:', error);
    done(true);
  }
};

const getInitial = (lastName: string | undefined | null): string => {
  if (!lastName) return '?';
  return lastName.charAt(0).toUpperCase();
};

const getAvatarColor = (lastName: string | undefined | null): string => {
  // Array of attractive colors for avatars
  const colors: string[] = [
    '#1976d2', // blue
    '#388e3c', // green
    '#f57c00', // orange
    '#7b1fa2', // purple
    '#c2185b', // pink
    '#0097a7', // cyan
    '#5d4037', // brown
    '#455a64', // blue grey
    '#d32f2f', // red
    '#0288d1', // light blue
    '#00796b', // teal
    '#8e24aa', // deep purple
    '#e64a19', // deep orange
    '#303f9f', // indigo
    '#c62828', // dark red
    '#558b2f', // light green
    '#ef6c00', // amber
    '#6a1b9a', // purple
    '#00838f', // cyan
    '#ad1457', // pink
    '#1565c0', // blue
    '#2e7d32', // green
    '#e65100', // orange
    '#4a148c', // purple
    '#b71c1c', // red
  ];

  if (!lastName) {
    return colors[0]!; // Default color for missing lastName
  }

  const initial = lastName.charAt(0).toUpperCase();
  const charCode = initial.charCodeAt(0);
  // Use modulo to consistently map character to color index
  const colorIndex = charCode % colors.length;
  return colors[colorIndex]!;
};

const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    $q.notify({
      type: 'positive',
      message: `${label} copied to clipboard`,
      position: 'top',
      timeout: 2000,
    });
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to copy to clipboard',
      position: 'top',
      timeout: 2000,
    });
  }
};

const isEmployeeSelected = (employeeId: string): boolean => {
  const currentEmployeeId = route.params.id as string | undefined;
  return currentEmployeeId === employeeId;
};

const navigateToEmployee = (employeeId: string) => {
  router.push(employeePath(employeeId)).catch((err) => {
    console.error('Navigation error:', err);
  });
};
</script>

<style scoped>
.employee-list-container {
  width: 100%;
}

.employee-card {
  position: relative;
  transition: box-shadow 0.3s ease;
  cursor: pointer;
}

.employee-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.employee-card-selected {
  background-color: #f5f5f5;
  border-left: 4px solid var(--q-primary);
}

.employee-card-header {
  position: absolute;
  top: 12px;
  right: 32px;
  z-index: 1;
}

.employee-info-section {
  padding-top: 16px;
  padding-bottom: 16px;
}

.employee-details-section {
  padding-top: 16px;
  padding-bottom: 16px;
}

.copyable-field-container {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  position: relative;
}

.copy-icon {
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
  color: var(--q-primary);
}

.copyable-field-container:hover .copy-icon {
  opacity: 1;
}

.copy-icon:hover {
  opacity: 1;
  transform: scale(1.1);
}
</style>

<template>
  <div>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6">
        Employee form access
        <q-chip v-if="selectedRole" color="primary" text-color="white" size="sm">
          {{ selectedRole.name }}
        </q-chip>
      </div>
      <q-btn
        v-if="selectedRole"
        color="primary"
        label="Save form access"
        :loading="saving"
        :disable="!dirty"
        @click="save"
      />
    </div>

    <div v-if="!selectedRole" class="text-center q-pa-md text-grey">
      Select a role to configure employee tabs and fields
    </div>

    <div v-else-if="loadingCatalog" class="text-center q-pa-md">
      <q-spinner color="primary" />
    </div>

    <div v-else>
      <div class="text-subtitle2 q-mb-sm">Tabs</div>
      <q-markup-table flat bordered dense class="q-mb-lg">
        <thead>
          <tr>
            <th class="text-left">Tab</th>
            <th class="text-left">Access</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tab in catalog?.tabs || []" :key="tab.key">
            <td>{{ tab.label }}</td>
            <td style="min-width: 160px">
              <q-select
                v-model="draft.tabs[tab.key]"
                :options="tabModeOptions"
                dense
                outlined
                emit-value
                map-options
                @update:model-value="markDirty"
              />
            </td>
          </tr>
        </tbody>
      </q-markup-table>

      <div class="text-subtitle2 q-mb-sm">Fields</div>
      <q-markup-table flat bordered dense>
        <thead>
          <tr>
            <th class="text-left">Field</th>
            <th class="text-left">Tab</th>
            <th class="text-left">Access</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="field in catalog?.fields || []" :key="field.key">
            <td>
              <span>{{ field.label }}</span>
              <q-chip
                v-if="field.is_system === false"
                class="q-ml-sm"
                color="teal"
                text-color="white"
                size="sm"
                dense
              >
                Custom
              </q-chip>
            </td>
            <td class="text-grey">{{ tabLabel(field.tab) }}</td>
            <td style="min-width: 160px">
              <q-select
                v-model="draft.fields[field.key]"
                :options="fieldModeOptions"
                dense
                outlined
                emit-value
                map-options
                @update:model-value="markDirty"
              />
            </td>
          </tr>
        </tbody>
      </q-markup-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoleStore } from '../../stores/role-store';
import type { EmployeeFormAccess } from '@core/types/employee-form-access';

const $q = useQuasar();
const roleStore = useRoleStore();

const selectedRole = computed(() => roleStore.selectedRole);
const catalog = computed(() => roleStore.formAccessCatalog);
const loadingCatalog = computed(() => roleStore.isLoadingFormAccessCatalog);
const saving = ref(false);
const dirty = ref(false);

const draft = reactive<EmployeeFormAccess>({
  tabs: {},
  fields: {},
});

const tabModeOptions = [
  { label: 'Hidden', value: 'hidden' },
  { label: 'View', value: 'view' },
  { label: 'Edit', value: 'edit' },
];

const fieldModeOptions = [
  { label: 'Hidden', value: 'hidden' },
  { label: 'View', value: 'view' },
  { label: 'Locked after create', value: 'locked' },
  { label: 'Edit', value: 'edit' },
];

function markDirty() {
  dirty.value = true;
}

function tabLabel(key: string): string {
  return catalog.value?.tabs.find((tab) => tab.key === key)?.label ?? key;
}

function catalogDefaults(): EmployeeFormAccess {
  const tabs: EmployeeFormAccess['tabs'] = {};
  const fields: EmployeeFormAccess['fields'] = {};
  for (const tab of catalog.value?.tabs ?? []) {
    tabs[tab.key] = 'hidden';
  }
  for (const field of catalog.value?.fields ?? []) {
    fields[field.key] = 'hidden';
  }
  return { tabs, fields };
}

function loadDraftFromRole() {
  const defaults = catalogDefaults();
  const profile = selectedRole.value?.employee_form_access;
  draft.tabs = { ...defaults.tabs, ...(profile?.tabs ?? {}) };
  draft.fields = { ...defaults.fields, ...(profile?.fields ?? {}) };
  dirty.value = false;
}

watch([selectedRole, catalog], () => {
  loadDraftFromRole();
}, { immediate: true });

onMounted(async () => {
  await roleStore.fetchFormAccessCatalog();
});

async function save() {
  if (!selectedRole.value) return;

  saving.value = true;
  try {
    const updated = await roleStore.updateEmployeeFormAccess(selectedRole.value.id, {
      tabs: { ...draft.tabs },
      fields: { ...draft.fields },
    });

    if (updated) {
      dirty.value = false;
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Employee form access saved.',
      });
    } else {
      throw new Error(roleStore.error || 'Failed to save');
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error instanceof Error ? error.message : 'Failed to save form access.',
    });
  } finally {
    saving.value = false;
  }
}
</script>

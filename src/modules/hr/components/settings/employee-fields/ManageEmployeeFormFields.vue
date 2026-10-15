<template>
  <q-page class="q-pa-md">
    <q-card flat bordered>
      <q-card-section class="row items-center q-gutter-sm">
        <div>
          <div class="text-h6">Employee fields</div>
          <div class="text-caption text-grey-7">
            Built-in fields stay on the employee form. Add custom fields here, then grant view or edit access on Roles.
          </div>
        </div>
        <q-space />
        <q-btn color="primary" icon="add" label="Add field" @click="openCreate" />
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-table
          flat
          bordered
          dense
          row-key="key"
          :rows="rows"
          :columns="columns"
          :loading="store.isLoading"
          no-data-label="No employee fields"
        >
          <template #body-cell-origin="props">
            <q-td :props="props">
              <q-badge :color="props.row.is_system ? 'grey' : 'teal'">
                {{ props.row.is_system ? 'Built-in' : 'Custom' }}
              </q-badge>
            </q-td>
          </template>
          <template #body-cell-input_type="props">
            <q-td :props="props">{{ inputTypeLabel(props.row.input_type) }}</q-td>
          </template>
          <template #body-cell-is_active="props">
            <q-td :props="props">
              <q-badge :color="props.row.is_active !== false ? 'positive' : 'grey'">
                {{ props.row.is_active !== false ? 'Active' : 'Inactive' }}
              </q-badge>
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                v-if="!props.row.is_system"
                flat
                round
                dense
                icon="edit"
                color="primary"
                @click="openEdit(props.row)"
              />
              <q-btn
                v-if="!props.row.is_system"
                flat
                round
                dense
                icon="delete"
                color="negative"
                @click="confirmDelete(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <q-dialog v-model="dialogOpen" position="right">
      <AppDialogCard>
        <AppDialogHeader>
          <div class="text-h6">{{ editingId ? 'Edit field' : 'Add field' }}</div>
        </AppDialogHeader>
        <AppDialogBody>
          <q-form class="app-dialog-form q-gutter-md" @submit.prevent="save">
            <q-input
              v-model="form.label"
              label="Label *"
              outlined
              dense
              :rules="[(value) => !!String(value || '').trim() || 'Label is required']"
              :disable="saving"
            />
            <q-select
              v-model="form.tab_key"
              :options="tabOptions"
              emit-value
              map-options
              label="Tab *"
              outlined
              dense
              :rules="[(value) => !!value || 'Tab is required']"
              :disable="saving"
            />
            <q-select
              v-model="form.input_type"
              :options="inputTypeOptions"
              emit-value
              map-options
              label="Input type *"
              outlined
              dense
              :disable="saving"
            />
            <q-input
              v-model="form.help_text"
              label="Help text"
              outlined
              dense
              :disable="saving"
            />
            <q-input
              v-if="editingId"
              v-model="form.key"
              label="Key"
              outlined
              dense
              readonly
              hint="Used when saving values on the employee record"
            />
            <q-toggle v-model="form.is_required" label="Required" :disable="saving" />
            <q-toggle v-model="form.is_active" label="Active" :disable="saving" />

            <div v-if="form.input_type === 'select'" class="q-gutter-sm">
              <div class="text-subtitle2">Options</div>
              <div v-for="(option, index) in form.options" :key="index" class="row q-gutter-sm items-center no-wrap">
                <q-input
                  v-model="option.label"
                  class="col"
                  label="Label"
                  outlined
                  dense
                  :disable="saving"
                />
                <q-input
                  v-model="option.value"
                  class="col"
                  label="Value"
                  outlined
                  dense
                  :disable="saving"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="close"
                  color="grey"
                  :disable="saving || form.options.length <= 1"
                  @click="form.options.splice(index, 1)"
                />
              </div>
              <q-btn
                flat
                no-caps
                icon="add"
                label="Add option"
                color="primary"
                :disable="saving"
                @click="form.options.push({ label: '', value: '' })"
              />
            </div>

            <div class="row justify-end q-gutter-sm app-dialog-form-actions">
              <q-btn flat label="Cancel" color="grey" :disable="saving" v-close-popup />
              <q-btn type="submit" color="primary" :label="editingId ? 'Save' : 'Create'" :loading="saving" />
            </div>
          </q-form>
        </AppDialogBody>
      </AppDialogCard>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import type {
  EmployeeFormFieldCatalogItem,
  EmployeeFormFieldInputType,
  EmployeeFormFieldOption,
} from '@core/types/employee-form-access';
import { useEmployeeFormFieldStore } from '@hr/stores/employee-form-field-store';

defineProps<{ title?: string }>();

const store = useEmployeeFormFieldStore();
const $q = useQuasar();
const dialogOpen = ref(false);
const editingId = ref<string | null>(null);
const saving = computed(() => store.isSaving);

const form = reactive({
  label: '',
  tab_key: 'personal',
  key: '',
  input_type: 'text' as EmployeeFormFieldInputType,
  is_required: false,
  is_active: true,
  help_text: '',
  options: [{ label: '', value: '' }] as EmployeeFormFieldOption[],
});

const inputTypeOptions: Array<{ label: string; value: EmployeeFormFieldInputType }> = [
  { label: 'Short text', value: 'text' },
  { label: 'Paragraph', value: 'textarea' },
  { label: 'Number', value: 'number' },
  { label: 'Date', value: 'date' },
  { label: 'Dropdown', value: 'select' },
  { label: 'Yes / No', value: 'toggle' },
];

const tabOptions = computed(() =>
  store.tabs.map((tab) => ({ label: `${tab.label} (${tab.group})`, value: tab.key })),
);

const rows = computed(() => store.fields);

const columns: QTableProps['columns'] = [
  { name: 'label', label: 'Field', field: 'label', align: 'left', sortable: true },
  { name: 'tab', label: 'Tab', field: (row: EmployeeFormFieldCatalogItem) => tabLabel(row.tab), align: 'left' },
  { name: 'origin', label: 'Type', field: 'is_system', align: 'left' },
  { name: 'input_type', label: 'Input', field: 'input_type', align: 'left' },
  { name: 'is_active', label: 'Status', field: 'is_active', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'right' },
];

function tabLabel(key: string): string {
  return store.tabs.find((tab) => tab.key === key)?.label ?? key;
}

function inputTypeLabel(type: EmployeeFormFieldCatalogItem['input_type']): string {
  return inputTypeOptions.find((option) => option.value === type)?.label ?? (type || 'Short text');
}

function resetForm() {
  form.label = '';
  form.tab_key = store.tabs[0]?.key || 'personal';
  form.key = '';
  form.input_type = 'text';
  form.is_required = false;
  form.is_active = true;
  form.help_text = '';
  form.options = [{ label: '', value: '' }];
}

function openCreate() {
  editingId.value = null;
  resetForm();
  dialogOpen.value = true;
}

function openEdit(row: EmployeeFormFieldCatalogItem) {
  if (!row.id) {
    return;
  }
  editingId.value = row.id;
  form.label = row.label;
  form.tab_key = row.tab;
  form.key = row.key;
  form.input_type = row.input_type || 'text';
  form.is_required = Boolean(row.is_required);
  form.is_active = row.is_active !== false;
  form.help_text = row.help_text || '';
  form.options = row.options && row.options.length > 0
    ? row.options.map((option) => ({ ...option }))
    : [{ label: '', value: '' }];
  dialogOpen.value = true;
}

function confirmDelete(row: EmployeeFormFieldCatalogItem) {
  if (!row.id) {
    return;
  }
  $q.dialog({
    title: 'Delete field?',
    message: `Delete ${row.label}? Existing employee values for this field are kept but no longer shown.`,
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void store.deleteField(row.id as string).then(
      () => $q.notify({ type: 'positive', message: 'Employee field deleted.' }),
      (error: unknown) => {
        $q.notify({
          type: 'negative',
          message: error instanceof Error ? error.message : 'Could not delete field.',
        });
      },
    );
  });
}

async function save() {
  const payload = {
    label: form.label.trim(),
    tab_key: form.tab_key,
    input_type: form.input_type,
    is_required: form.is_required,
    is_active: form.is_active,
    help_text: form.help_text.trim() || null,
    options: form.input_type === 'select'
      ? form.options.filter((option) => option.label.trim() || option.value.trim())
      : [],
  };

  try {
    if (editingId.value) {
      await store.updateField(editingId.value, payload);
      $q.notify({ type: 'positive', message: 'Employee field saved.' });
    } else {
      await store.createField(payload);
      $q.notify({ type: 'positive', message: 'Employee field created.' });
    }
    dialogOpen.value = false;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not save field.',
    });
  }
}

onMounted(() => {
  void store.fetchCatalog(true).catch((error: unknown) => {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not load employee fields.',
    });
  });
});
</script>

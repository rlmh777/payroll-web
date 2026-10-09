<template>
  <q-page class="q-pa-md">
    <ContractExpiryReminderCard v-if="props.channel === 'email'" />

    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6">{{ heading }}</div>
        <div class="text-body2 text-grey-7 q-mt-xs">{{ description }}</div>
      </q-card-section>

      <q-separator />

      <q-card-section class="row items-center q-gutter-sm">
        <q-input
          v-model="search"
          dense
          outlined
          clearable
          label="Search templates"
          class="col-grow"
        />
        <q-btn color="primary" icon="add" label="Add template" @click="openCreate" />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-table
          flat
          bordered
          dense
          row-key="id"
          :rows="filteredRows"
          :columns="columns"
          :loading="store.isLoading"
          :no-data-label="props.channel === 'email' ? 'No email templates' : 'No letter templates'"
        >
          <template #body-cell-category="props">
            <q-td :props="props">{{ categoryLabel(props.row.category) }}</q-td>
          </template>
          <template #body-cell-is_active="props">
            <q-td :props="props">
              <q-badge :color="props.row.is_active ? 'positive' : 'grey'">
                {{ props.row.is_active ? 'Active' : 'Inactive' }}
              </q-badge>
              <q-badge v-if="props.row.is_system" class="q-ml-xs" color="grey-7" outline>System</q-badge>
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn flat round dense icon="edit" color="primary" size="sm" @click="openEdit(props.row)" />
              <q-btn
                v-if="!props.row.is_system"
                flat
                round
                dense
                icon="delete"
                color="negative"
                size="sm"
                @click="confirmDelete(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <HrTemplateDialog
      v-model="showDialog"
      :channel="props.channel"
      :record="editing"
      @saved="refresh"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import {
  useHrTemplateStore,
  type HrTemplate,
  type HrTemplateChannel,
} from '@hr/stores/hr-template-store';
import HrTemplateDialog from './HrTemplateDialog.vue';
import ContractExpiryReminderCard from './ContractExpiryReminderCard.vue';

const props = defineProps<{
  title?: string;
  channel: HrTemplateChannel;
}>();

const $q = useQuasar();
const store = useHrTemplateStore();
const search = ref('');
const showDialog = ref(false);
const editing = ref<HrTemplate | null>(null);

const heading = computed(() =>
  props.channel === 'email' ? 'Email templates' : 'Letter templates',
);
const description = computed(() =>
  props.channel === 'email'
    ? 'Messages for leave updates, password changes, job applications, contract expiry reminders, and other notices. Merge fields are replaced when the email is sent.'
    : 'Letters of employment for banks, embassies, and other requests. Merge fields are replaced when a letter is generated.',
);

const filteredRows = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) {
    return store.templates;
  }
  return store.templates.filter((row) =>
    [row.name, row.category, row.subject ?? ''].some((value) => value.toLowerCase().includes(term)),
  );
});

const columns = computed<QTableProps['columns']>(() => {
  const cols: QTableProps['columns'] = [
    { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
    { name: 'category', label: 'Used for', field: 'category', align: 'left', sortable: true },
  ];
  if (props.channel === 'email') {
    cols.push({ name: 'subject', label: 'Subject', field: 'subject', align: 'left' });
  }
  cols.push(
    { name: 'is_active', label: 'Status', field: 'is_active', align: 'left' },
    { name: 'actions', label: '', field: 'actions', align: 'right' },
  );
  return cols;
});

function categoryLabel(value: string): string {
  return store.categories.find((item) => item.value === value)?.label ?? value;
}

async function refresh() {
  try {
    await store.fetchTemplates(props.channel);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not load templates.',
    });
  }
}

function openCreate() {
  editing.value = null;
  showDialog.value = true;
}

function openEdit(row: HrTemplate) {
  editing.value = row;
  showDialog.value = true;
}

function confirmDelete(row: HrTemplate) {
  $q.dialog({
    title: 'Delete template',
    message: `Delete “${row.name}”?`,
    cancel: true,
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteTemplate(row.id);
        $q.notify({ type: 'positive', message: 'Template deleted.' });
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: error instanceof Error ? error.message : 'Failed to delete template.',
        });
      }
    })();
  });
}

onMounted(() => {
  void refresh();
});
</script>

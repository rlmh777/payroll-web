<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <q-card-section class="row items-center q-gutter-sm">
        <q-input
          v-model="search"
          dense
          outlined
          clearable
          label="Search leave types"
          class="col-grow"
          @keyup.enter="refresh"
        />
        <q-btn color="primary" icon="add" label="Add leave type" @click="openCreate" />
      </q-card-section>

      <q-card-section class="q-pa-none">
        <q-table
          title="Leave types & organization entitlements"
          :rows="store.leaveTypes"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          :loading="store.isLoadingLeaveTypes"
          v-model:pagination="pagination"
          :rows-per-page-options="[10, 25, 50]"
          @request="onRequest"
          no-data-label="No leave types"
        >
          <template #body-cell-isPaid="props">
            <q-td :props="props">{{ props.row.isPaid ? 'Paid' : 'Unpaid' }}</q-td>
          </template>
          <template #body-cell-affectsBalance="props">
            <q-td :props="props">{{ props.row.affectsBalance ? 'Yes' : 'No' }}</q-td>
          </template>
          <template #body-cell-annualEntitlementDays="props">
            <q-td :props="props">{{ formatLeaveDays(Number(props.row.policy?.annualEntitlementDays ?? 0)) }}</q-td>
          </template>
          <template #body-cell-accrualMethod="props">
            <q-td :props="props">{{ formatAccrualMethod(props.row.policy?.accrualMethod) }}</q-td>
          </template>
          <template #body-cell-isActive="props">
            <q-td :props="props">
              <q-icon :name="props.row.isActive ? 'check_circle' : 'cancel'" :color="props.row.isActive ? 'positive' : 'grey'" />
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn flat round dense icon="edit" color="primary" size="sm" @click="openEdit(props.row)" />
              <q-btn flat round dense icon="delete" color="negative" size="sm" @click="onDelete(props.row)" />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 520px; max-width: 640px">
        <q-card-section>
          <div class="text-h6">{{ editingId ? 'Edit leave type' : 'Add leave type' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-8">
              <q-input v-model="form.name" label="Name *" outlined dense />
            </div>
            <div class="col-12 col-sm-4">
              <q-input v-model="form.code" label="Code *" outlined dense hint="e.g. VACATION" />
            </div>
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-4">
              <q-input v-model.number="form.annualEntitlementDays" type="number" min="0" step="0.5" label="Annual days" outlined dense />
            </div>
            <div class="col-12 col-sm-8">
              <q-select
                v-model="form.accrualMethod"
                :options="accrualOptions"
                label="Accrual method"
                outlined
                dense
                emit-value
                map-options
              />
            </div>
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-6"><q-toggle v-model="form.isPaid" label="Paid leave" /></div>
            <div class="col-6"><q-toggle v-model="form.affectsBalance" label="Track balance" /></div>
            <div class="col-6"><q-toggle v-model="form.requiresCertification" label="Requires certification" /></div>
            <div class="col-6"><q-toggle v-model="form.isActive" label="Active" /></div>
            <div class="col-6"><q-toggle v-model="form.policyEnabled" label="Policy enabled" /></div>
          </div>
          <q-input v-model.number="form.sortOrder" type="number" min="0" label="Sort order" outlined dense />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Save" :loading="store.isLoading" @click="save" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import { useLeaveTypeStore, type LeaveType } from 'src/stores/leave-type-store';
import {
  LEAVE_ACCRUAL_OPTIONS,
  createDefaultLeaveTypeForm,
  formatAccrualMethod,
  formatLeaveDays,
  mapLeaveTypeToForm,
  type LeaveTypeFormModel,
} from './leave-type-form';

const $q = useQuasar();
const store = useLeaveTypeStore();
const search = ref('');
const showDialog = ref(false);
const editingId = ref<number | null>(null);
const form = reactive<LeaveTypeFormModel>(createDefaultLeaveTypeForm());
const accrualOptions = LEAVE_ACCRUAL_OPTIONS;

const pagination = ref({ page: 1, rowsPerPage: 25, rowsNumber: 0 });

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'code', label: 'Code', field: 'code', align: 'left' },
  { name: 'annualEntitlementDays', label: 'Annual days', field: 'annualEntitlementDays', align: 'right' },
  { name: 'accrualMethod', label: 'Accrual', field: 'accrualMethod', align: 'left' },
  { name: 'isPaid', label: 'Pay', field: 'isPaid', align: 'left' },
  { name: 'affectsBalance', label: 'Balance', field: 'affectsBalance', align: 'left' },
  { name: 'isActive', label: 'Active', field: 'isActive', align: 'center' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

async function refresh() {
  await store.fetchLeaveTypes(search.value || undefined, pagination.value.page, pagination.value.rowsPerPage);
  pagination.value.rowsNumber = store.total;
}

async function onRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
  pagination.value.page = props.pagination.page;
  pagination.value.rowsPerPage = props.pagination.rowsPerPage;
  await refresh();
}

function openCreate() {
  editingId.value = null;
  Object.assign(form, createDefaultLeaveTypeForm());
  showDialog.value = true;
}

function openEdit(row: LeaveType) {
  editingId.value = row.id;
  Object.assign(form, mapLeaveTypeToForm(row));
  showDialog.value = true;
}

async function save() {
  if (!form.name.trim() || !form.code.trim()) {
    $q.notify({ color: 'negative', position: 'top', message: 'Name and code are required.' });
    return;
  }

  const payload = { ...form, name: form.name.trim(), code: form.code.trim().toUpperCase() };
  const result = editingId.value
    ? await store.updateLeaveType(editingId.value, payload)
    : await store.createLeaveType(payload);

  if (!result) {
    $q.notify({ color: 'negative', position: 'top', message: store.error || 'Save failed.' });
    return;
  }

  $q.notify({ color: 'positive', position: 'top', message: 'Leave type saved.' });
  showDialog.value = false;
  await refresh();
}

function onDelete(row: LeaveType) {
  $q.dialog({
    title: 'Delete leave type',
    message: `Delete "${row.name}"?`,
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void (async () => {
      const ok = await store.deleteLeaveType(row.id);
      if (!ok) {
        $q.notify({ color: 'negative', position: 'top', message: store.error || 'Delete failed.' });
        return;
      }
      $q.notify({ color: 'positive', position: 'top', message: 'Leave type deleted.' });
      await refresh();
    })();
  });
}

onMounted(refresh);
</script>

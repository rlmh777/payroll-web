<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="text-subtitle1">Request a contact update</div>
      <div class="text-caption text-grey-7">
        Address, phone, and email changes wait for approval. Your record is updated only after the last pipeline step completes.
      </div>
    </q-card-section>

    <q-card-section v-if="pending" class="q-pt-none">
      <q-banner class="bg-info text-white" rounded>
        A change is waiting at {{ pending.pipeline?.currentStep?.label || 'the next approver' }}.
        The live profile still shows your current details.
      </q-banner>
      <q-markup-table flat dense class="q-mt-md">
        <thead>
          <tr>
            <th class="text-left">Field</th>
            <th class="text-left">Current</th>
            <th class="text-left">Requested</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in pending.changes || []" :key="row.field">
            <td>{{ row.label }}</td>
            <td>{{ displayValue(row.currentLabel ?? row.current) }}</td>
            <td>{{ displayValue(row.proposedLabel ?? row.proposed) }}</td>
          </tr>
        </tbody>
      </q-markup-table>
      <div v-if="pending.can_cancel" class="q-mt-md">
        <q-btn
          outline
          color="negative"
          label="Cancel request"
          :loading="store.isSaving"
          @click="void cancelPending()"
        />
      </div>
    </q-card-section>

    <q-card-section v-else class="q-pt-none q-gutter-md">
      <div class="row q-col-gutter-sm">
        <div class="col-12 col-md-6">
          <q-input v-model="form.address1" outlined dense label="Address 1" />
        </div>
        <div class="col-12 col-md-6">
          <q-input v-model="form.address2" outlined dense label="Address 2" />
        </div>
        <div class="col-12 col-md-4">
          <LocalitySelect v-model="form.localityId" />
        </div>
        <div class="col-12 col-md-4">
          <q-input v-model="form.phone" outlined dense label="Phone" maxlength="12" />
        </div>
        <div class="col-12 col-md-4">
          <q-input v-model="form.email" outlined dense type="email" label="Email" />
        </div>
      </div>
      <div v-if="error" class="text-negative">{{ error }}</div>
      <q-btn color="primary" label="Submit for approval" :loading="store.isSaving" @click="void submit()" />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import LocalitySelect from '@hr/components/employee/common/LocalitySelect.vue';
import { useProfileChangeStore } from '@hr/stores/profile-change-store';
import type { Employee } from '@core/types/models';

const props = defineProps<{
  employee: Employee;
}>();

const emit = defineEmits<{
  updated: [];
}>();

const store = useProfileChangeStore();
const $q = useQuasar();
const error = ref<string | null>(null);
const pending = ref<Employee['pendingProfileChange']>(null);
const form = reactive({
  address1: '',
  address2: '',
  localityId: '' as string | null,
  phone: '',
  email: '',
});

function hydrate(employee: Employee) {
  pending.value = employee.pendingProfileChange ?? null;
  form.address1 = employee.address1 || '';
  form.address2 = employee.address2 || '';
  form.localityId = employee.localityId || null;
  form.phone = employee.phone || '';
  form.email = employee.email || '';
}

function displayValue(value: string | number | boolean | null | undefined) {
  if (value == null || value === '') return '—';
  return String(value);
}

async function submit() {
  error.value = null;
  try {
    await store.submit({
      address1: form.address1,
      address2: form.address2,
      localityId: form.localityId,
      phone: form.phone,
      email: form.email,
    });
    $q.notify({ type: 'positive', message: 'Submitted for approval. Your record will update after the last step.' });
    emit('updated');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to submit.';
  }
}

async function cancelPending() {
  if (!pending.value) return;
  try {
    await store.act(pending.value.id, 'cancel');
    $q.notify({ type: 'info', message: 'Profile change request cancelled.' });
    emit('updated');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to cancel.';
  }
}

watch(
  () => props.employee,
  (employee) => hydrate(employee),
  { immediate: true },
);
</script>

<template>
  <q-dialog v-model="isOpen" position="right" persistent>
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">{{ record ? 'Edit event' : 'Add event' }}</div>
      </AppDialogHeader>

      <AppDialogBody>
        <div class="text-body2 text-grey-7 q-mb-md">
          Company and department events show on the day header. Employee events appear on those employees’ rows.
        </div>

        <AppDialogForm>
          <div class="col-12">
            <q-input
              v-model="form.title"
              label="Title"
              outlined
              dense
              :rules="[(v) => !!String(v || '').trim() || 'Title is required']"
            />
          </div>

          <div class="col-12">
            <q-input
              v-model="form.description"
              label="Description"
              type="textarea"
              autogrow
              outlined
              dense
            />
          </div>

          <div class="col-6">
            <q-input
              :model-value="form.start_date ? formatCalendarDisplayDate(form.start_date) : ''"
              label="Start date"
              outlined
              dense
              readonly
              :rules="[(v) => !!form.start_date || 'Start date is required']"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="form.start_date"
                      mask="YYYY-MM-DD"
                    >
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-6">
            <q-input
              :model-value="form.end_date ? formatCalendarDisplayDate(form.end_date) : ''"
              label="End date"
              outlined
              dense
              readonly
              :rules="[
                () => !!form.end_date || 'End date is required',
                () => !form.start_date || !form.end_date || form.end_date >= form.start_date || 'End date must be on or after start',
              ]"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="form.end_date"
                      mask="YYYY-MM-DD"
                      :options="endDateOptions"
                    >
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12">
            <q-select
              v-model="form.audience_type"
              :options="audienceOptions"
              emit-value
              map-options
              label="Audience"
              outlined
              dense
            />
          </div>

          <div v-if="form.audience_type === 'departments'" class="col-12">
            <q-select
              v-model="form.department_ids"
              :options="departmentOptions"
              emit-value
              map-options
              multiple
              use-chips
              label="Departments"
              outlined
              dense
              :rules="[(v) => (Array.isArray(v) && v.length > 0) || 'Select at least one department']"
            />
          </div>

          <div v-if="form.audience_type === 'employees'" class="col-12">
            <q-select
              v-model="form.employee_ids"
              :options="filteredEmployeeOptions"
              emit-value
              map-options
              multiple
              use-chips
              use-input
              input-debounce="0"
              label="Employees"
              outlined
              dense
              :rules="[(v) => (Array.isArray(v) && v.length > 0) || 'Select at least one employee']"
              @filter="filterEmployees"
            />
          </div>

          <div class="col-12">
            <q-toggle v-model="form.is_active" label="Active" color="primary" />
          </div>
        </AppDialogForm>
      </AppDialogBody>

      <q-card-actions align="between" class="app-dialog-actions">
        <q-btn
          v-if="record"
          flat
          color="negative"
          label="Delete"
          :disable="saving"
          @click="confirmDelete"
        />
        <span v-else />

        <div class="row q-gutter-sm">
          <q-btn flat label="Cancel" color="grey" :disable="saving" v-close-popup />
          <q-btn color="primary" label="Save" :loading="saving" @click="save" />
        </div>
      </q-card-actions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import {
  useSchedulerNoticeStore,
  type SchedulerNotice,
  type SchedulerNoticeAudience,
} from '@hr/stores/scheduler-notice-store';
import { formatCalendarDisplayDate } from '@hr/utils/calendar-event-utils';

const props = defineProps<{
  modelValue: boolean;
  record?: SchedulerNotice | null;
  defaultStartDate?: string | null;
  defaultEndDate?: string | null;
  departmentOptions: Array<{ label: string; value: number }>;
  employeeOptions: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'saved'): void;
}>();

const $q = useQuasar();
const store = useSchedulerNoticeStore();
const saving = ref(false);
const filteredEmployeeOptions = ref<Array<{ label: string; value: string }>>([]);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const audienceOptions = [
  { label: 'Entire company', value: 'company' },
  { label: 'Selected departments', value: 'departments' },
  { label: 'Selected employees', value: 'employees' },
];

const form = reactive({
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  audience_type: 'company' as SchedulerNoticeAudience,
  department_ids: [] as number[],
  employee_ids: [] as string[],
  is_active: true,
});

function endDateOptions(dateValue: string): boolean {
  if (!form.start_date) {
    return true;
  }
  const normalized = dateValue.replace(/\//g, '-');
  return normalized >= form.start_date;
}

function resetForm() {
  form.title = props.record?.title ?? '';
  form.description = props.record?.description ?? '';
  form.start_date = props.record?.start_date ?? props.defaultStartDate ?? '';
  form.end_date = props.record?.end_date ?? props.defaultEndDate ?? props.defaultStartDate ?? '';
  form.audience_type = props.record?.audience_type ?? 'company';
  form.department_ids = [...(props.record?.department_ids ?? [])];
  form.employee_ids = [...(props.record?.employee_ids ?? [])];
  form.is_active = props.record?.is_active ?? true;
  filteredEmployeeOptions.value = [...props.employeeOptions];
}

watch(
  () => [props.modelValue, props.record] as const,
  ([open]) => {
    if (open) {
      resetForm();
    }
  },
);

watch(
  () => props.employeeOptions,
  (options) => {
    filteredEmployeeOptions.value = [...options];
  },
  { immediate: true },
);

function filterEmployees(val: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = val.trim().toLowerCase();
    if (!needle) {
      filteredEmployeeOptions.value = [...props.employeeOptions];
      return;
    }
    filteredEmployeeOptions.value = props.employeeOptions.filter((option) =>
      option.label.toLowerCase().includes(needle),
    );
  });
}

async function save() {
  if (!String(form.title || '').trim()) {
    $q.notify({ type: 'negative', message: 'Title is required' });
    return;
  }
  if (!form.start_date || !form.end_date) {
    $q.notify({ type: 'negative', message: 'Start and end dates are required' });
    return;
  }
  if (form.end_date < form.start_date) {
    $q.notify({ type: 'negative', message: 'End date must be on or after start' });
    return;
  }
  if (form.audience_type === 'departments' && form.department_ids.length === 0) {
    $q.notify({ type: 'negative', message: 'Select at least one department' });
    return;
  }
  if (form.audience_type === 'employees' && form.employee_ids.length === 0) {
    $q.notify({ type: 'negative', message: 'Select at least one employee' });
    return;
  }

  saving.value = true;
  try {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      start_date: form.start_date,
      end_date: form.end_date,
      audience_type: form.audience_type,
      is_active: form.is_active,
      department_ids: form.audience_type === 'departments' ? form.department_ids : [],
      employee_ids: form.audience_type === 'employees' ? form.employee_ids : [],
    };

    if (props.record) {
      await store.updateNotice(props.record.id, payload);
      $q.notify({ type: 'positive', message: 'Event updated' });
    } else {
      await store.createNotice(payload);
      $q.notify({ type: 'positive', message: 'Event created' });
    }

    emit('saved');
    isOpen.value = false;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save event',
    });
  } finally {
    saving.value = false;
  }
}

function confirmDelete() {
  if (!props.record) {
    return;
  }

  $q.dialog({
    title: 'Delete event',
    message: `Delete “${props.record.title}”?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      if (!props.record) {
        return;
      }
      saving.value = true;
      try {
        await store.deleteNotice(props.record.id);
        $q.notify({ type: 'positive', message: 'Event deleted' });
        emit('saved');
        isOpen.value = false;
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: error instanceof Error ? error.message : 'Failed to delete event',
        });
      } finally {
        saving.value = false;
      }
    })();
  });
}
</script>

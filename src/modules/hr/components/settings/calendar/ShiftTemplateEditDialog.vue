<template>
  <q-dialog v-model="isOpen" position="right" persistent>
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">{{ record ? 'Edit shift template' : 'New shift template' }}</div>
      </AppDialogHeader>

      <AppDialogBody>
        <AppDialogForm>
          <div class="col-12">
            <q-input
              v-model="form.name"
              label="Name (optional)"
              hint="Leave blank to use the time segments as the label"
              outlined
              dense
            />
          </div>

          <div class="col-12">
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-subtitle2">Time segments</div>
              <q-btn flat dense no-caps color="primary" icon="add" label="Add segment" @click="addSegment" />
            </div>

            <div
              v-for="(segment, index) in form.segments"
              :key="segment.key"
              class="row q-col-gutter-sm items-start q-mb-sm"
            >
              <div class="col-5">
                <q-input
                  v-model="segment.start_time"
                  label="Start"
                  outlined
                  dense
                  mask="##:##"
                  :rules="[(v) => !!v || 'Required']"
                >
                  <template #append>
                    <q-icon name="access_time" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-time v-model="segment.start_time" format24h />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="col-5">
                <q-input
                  v-model="segment.end_time"
                  label="End"
                  outlined
                  dense
                  mask="##:##"
                  :rules="[(v) => !!v || 'Required']"
                >
                  <template #append>
                    <q-icon name="access_time" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-time v-model="segment.end_time" format24h />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="col-2 flex flex-center">
                <q-btn
                  flat
                  dense
                  round
                  color="negative"
                  icon="delete"
                  :disable="form.segments.length <= 1"
                  @click="removeSegment(index)"
                />
              </div>
            </div>
          </div>

          <div class="col-12">
            <q-toggle v-model="form.include_lunch_hour" label="Include lunch break" />
          </div>

          <div v-if="form.include_lunch_hour" class="col-6">
            <q-input
              v-model.number="form.lunch_hour_hours"
              type="number"
              label="Lunch hours"
              outlined
              dense
              min="0"
              max="8"
              step="0.25"
            />
          </div>

          <div class="col-12">
            <q-select
              v-model="form.department_ids"
              :options="departmentOptions"
              label="Allowed departments"
              outlined
              dense
              multiple
              use-chips
              emit-value
              map-options
              clearable
              options-dense
            />
            <div class="text-caption text-grey-7 q-mt-xs">
              Leave empty to allow assigning this shift for any department.
            </div>
          </div>

          <div class="col-12">
            <q-toggle v-model="form.is_active" label="Active" />
          </div>
        </AppDialogForm>
      </AppDialogBody>

      <AppDialogActions>
        <q-btn flat label="Cancel" color="grey" :disable="shiftTemplateStore.isSaving" v-close-popup />
        <q-btn
          color="primary"
          :label="record ? 'Save' : 'Create'"
          :loading="shiftTemplateStore.isSaving"
          @click="save"
        />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import { useDepartmentStore } from '@hr/stores/department-store';
import {
  useShiftTemplateStore,
  type ShiftTemplate,
} from '@hr/stores/shift-template-store';

type SegmentForm = {
  key: string;
  start_time: string;
  end_time: string;
};

const props = defineProps<{
  modelValue: boolean;
  record?: ShiftTemplate | null;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'saved', template: ShiftTemplate): void;
}>();

const $q = useQuasar();
const departmentStore = useDepartmentStore();
const shiftTemplateStore = useShiftTemplateStore();

const form = ref({
  name: '',
  segments: [{ key: crypto.randomUUID(), start_time: '09:00', end_time: '17:00' }] as SegmentForm[],
  include_lunch_hour: false,
  lunch_hour_hours: 1,
  is_active: true,
  department_ids: [] as number[],
});

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const departmentOptions = computed(() =>
  departmentStore.departments
    .map((department) => ({ label: department.name, value: department.id }))
    .sort((left, right) => left.label.localeCompare(right.label)),
);

function resetForm(record: ShiftTemplate | null | undefined) {
  if (record) {
    form.value = {
      name: record.name ?? '',
      segments: record.segments.map((segment) => ({
        key: crypto.randomUUID(),
        start_time: segment.start_time,
        end_time: segment.end_time,
      })),
      include_lunch_hour: record.include_lunch_hour,
      lunch_hour_hours: record.lunch_hour_hours || 1,
      is_active: record.is_active,
      department_ids: [...record.department_ids],
    };
    return;
  }

  form.value = {
    name: '',
    segments: [{ key: crypto.randomUUID(), start_time: '09:00', end_time: '17:00' }],
    include_lunch_hour: false,
    lunch_hour_hours: 1,
    is_active: true,
    department_ids: [],
  };
}

watch(
  () => [props.modelValue, props.record] as const,
  ([open]) => {
    if (open) {
      resetForm(props.record);
      if (!departmentStore.departments.length) {
        void departmentStore.fetchDepartments();
      }
    }
  },
);

function addSegment() {
  form.value.segments.push({
    key: crypto.randomUUID(),
    start_time: '09:00',
    end_time: '17:00',
  });
}

function removeSegment(index: number) {
  if (form.value.segments.length <= 1) {
    return;
  }
  form.value.segments.splice(index, 1);
}

async function save() {
  const name = form.value.name.trim() || null;

  const segments = form.value.segments
    .map((segment) => ({
      start_time: segment.start_time,
      end_time: segment.end_time,
    }))
    .filter((segment) => segment.start_time && segment.end_time);

  if (!segments.length) {
    $q.notify({ type: 'warning', message: 'Add at least one time segment.' });
    return;
  }

  const payload = {
    name,
    segments,
    include_lunch_hour: form.value.include_lunch_hour,
    lunch_hour_hours: form.value.lunch_hour_hours,
    is_active: form.value.is_active,
    department_ids: form.value.department_ids,
  };

  const saved = props.record
    ? await shiftTemplateStore.updateTemplate(props.record.id, payload)
    : await shiftTemplateStore.createTemplate(payload);

  if (!saved) {
    $q.notify({
      type: 'negative',
      message: shiftTemplateStore.error || 'Unable to save shift template.',
    });
    return;
  }

  $q.notify({
    type: 'positive',
    message: props.record ? 'Shift template updated.' : 'Shift template created.',
  });
  emit('saved', saved);
  isOpen.value = false;
}
</script>

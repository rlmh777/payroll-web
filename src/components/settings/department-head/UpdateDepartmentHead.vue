<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="q-drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Update Department Head</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="closeDialog" />
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <div v-if="assignment" class="text-body2 text-grey-7 q-mb-md">
          {{ assignment.departmentName }} · {{ assignment.employeeName }}
        </div>

        <q-form class="q-gutter-md" @submit.prevent="save">
          <q-input
            v-model="form.notes"
            type="textarea"
            label="Notes"
            outlined
            dense
            autogrow
          />
          <SsBenefitDateField
            v-if="assignment?.isCurrent"
            v-model="form.endDate"
            label="End assignment on"
            clearable
            :disable="saving"
          />
          <div v-if="assignment?.isCurrent" class="text-caption text-grey-7">
            Leave blank to keep the current head in place.
          </div>

          <q-card-actions align="right" class="q-pt-md">
            <q-btn flat label="Cancel" color="grey" :disable="saving" @click="closeDialog" />
            <q-btn type="submit" color="primary" :loading="saving" label="Save" />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import SsBenefitDateField from 'src/components/employee/ss-benefit/SsBenefitDateField.vue';
import { useDepartmentHeadStore } from 'src/stores/department-head-store';

const $q = useQuasar();
const store = useDepartmentHeadStore();
const saving = ref(false);

const form = reactive({
  notes: '',
  endDate: null as string | null,
});

const assignment = computed(() => store.assignmentToEdit);

const isOpen = computed({
  get: () => !!store.assignmentToEdit,
  set: (value) => {
    if (!value) {
      store.setAssignmentToEdit(null);
    }
  },
});

watch(assignment, (value) => {
  form.notes = value?.notes ?? '';
  form.endDate = null;
}, { immediate: true });

function closeDialog() {
  store.setAssignmentToEdit(null);
  form.notes = '';
  form.endDate = null;
}

async function save() {
  if (!assignment.value) {
    return;
  }

  saving.value = true;

  try {
    await store.updateAssignment(assignment.value.id, {
      notes: form.notes.trim() || null,
      endDate: form.endDate || null,
    });
    $q.notify({ color: 'positive', position: 'top', message: 'Department head assignment updated.' });
    closeDialog();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error instanceof Error ? error.message : 'Failed to update assignment.',
    });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.q-drawer-card {
  width: 34vw;
  max-width: 460px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.q-drawer-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

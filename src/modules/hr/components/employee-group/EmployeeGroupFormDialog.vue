<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)">
    <AppDialogCard modal>
      <AppDialogHeader>
        <div class="text-h6">{{ group?.id ? 'Edit group' : 'New employee group' }}</div>
      </AppDialogHeader>

      <AppDialogBody>
        <q-form @submit.prevent="save">
          <AppDialogForm>
            <div class="col-12">
              <q-input v-model="form.name" label="Name" outlined dense :rules="[(value) => !!String(value || '').trim() || 'Required']" />
            </div>
            <div class="col-12">
              <q-input v-model="form.description" label="Description" outlined dense type="textarea" autogrow />
            </div>
            <div class="col-12">
              <q-toggle v-model="useColor" label="Highlight color" :disable="saving" />
              <div v-if="useColor" class="q-mt-sm">
                <div class="row items-center q-gutter-sm">
                  <q-color
                    v-model="form.color"
                    format-model="hex"
                    :disable="saving"
                    class="employee-group-color-picker"
                  />
                  <q-badge
                    v-if="form.color"
                    :style="{ backgroundColor: form.color }"
                    :label="form.name.trim() || 'Preview'"
                  />
                </div>
              </div>
            </div>
            <div class="col-12">
              <q-toggle v-model="form.isActive" label="Active" />
            </div>
          </AppDialogForm>
        </q-form>
      </AppDialogBody>

      <AppDialogActions>
        <q-btn flat label="Cancel" @click="$emit('update:modelValue', false)" />
        <q-btn color="primary" label="Save" :loading="saving" @click="save" />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import { useEmployeeGroupStore, type EmployeeGroup } from '@hr/stores/employee-group-store';

const props = defineProps<{
  modelValue: boolean;
  group?: EmployeeGroup | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const $q = useQuasar();
const groupStore = useEmployeeGroupStore();
const saving = ref(false);
const useColor = ref(false);

const DEFAULT_GROUP_COLOR = '#1976D2';

const form = reactive({
  name: '',
  description: '',
  color: DEFAULT_GROUP_COLOR,
  isActive: true,
});

watch(
  () => [props.modelValue, props.group] as const,
  () => {
    if (!props.modelValue) {
      return;
    }

    form.name = props.group?.name ?? '';
    form.description = props.group?.description ?? '';
    form.color = props.group?.color ?? DEFAULT_GROUP_COLOR;
    form.isActive = props.group?.isActive ?? true;
    useColor.value = Boolean(props.group?.color);
  },
  { immediate: true },
);

async function save() {
  const name = form.name.trim();
  if (!name) {
    $q.notify({ type: 'warning', message: 'Group name is required.' });
    return;
  }

  saving.value = true;

  try {
    const payload = {
      name,
      description: form.description.trim() || null,
      color: useColor.value ? form.color : null,
      isActive: form.isActive,
    };

    if (props.group?.id) {
      await groupStore.updateGroup(props.group.id, payload);
    } else {
      await groupStore.createGroup(payload);
    }

    emit('saved');
    emit('update:modelValue', false);
    $q.notify({ type: 'positive', message: 'Employee group saved.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save employee group.',
    });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.employee-group-color-picker {
  max-width: 220px;
}
</style>

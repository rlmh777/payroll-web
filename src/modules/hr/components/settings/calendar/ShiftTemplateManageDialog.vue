<template>
  <q-dialog v-model="isOpen" position="right">
    <AppDialogCard class="shift-template-manage-card">
      <AppDialogHeader>
        <div class="text-h6">Shift templates</div>
        <template #close>
          <q-btn flat round dense icon="close" v-close-popup />
        </template>
      </AppDialogHeader>

      <AppDialogBody>
        <div class="row items-center justify-between q-mb-md">
          <div class="text-body2 text-grey-7">
            Reusable start/end presets for assigning work on the scheduler.
          </div>
          <q-btn
            color="primary"
            unelevated
            dense
            icon="add"
            label="New"
            @click="openCreate"
          />
        </div>

        <q-inner-loading :showing="shiftTemplateStore.isLoading">
          <q-spinner color="primary" size="32px" />
        </q-inner-loading>

        <q-list v-if="shiftTemplateStore.templates.length" bordered separator class="rounded-borders">
          <q-item v-for="template in shiftTemplateStore.templates" :key="template.id">
            <q-item-section>
              <q-item-label>{{ shiftTemplateDisplayLabel(template) }}</q-item-label>
              <q-item-label caption>
                {{ formatSegments(template) }}
                <span v-if="template.include_lunch_hour"> · lunch</span>
                <span v-if="!template.is_active"> · inactive</span>
              </q-item-label>
              <q-item-label v-if="template.departments.length" caption>
                {{ template.departments.map((department) => department.name).join(', ') }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row q-gutter-xs">
                <q-btn flat dense round icon="edit" @click="openEdit(template)" />
                <q-btn flat dense round color="negative" icon="delete" @click="confirmDelete(template)" />
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <div v-else-if="!shiftTemplateStore.isLoading" class="text-grey-6 text-center q-pa-lg">
          No shift templates yet.
        </div>
      </AppDialogBody>
    </AppDialogCard>
  </q-dialog>

  <ShiftTemplateEditDialog
    v-model="showEditDialog"
    :record="editingTemplate"
    @saved="onSaved"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import {
  shiftTemplateDisplayLabel,
  useShiftTemplateStore,
  type ShiftTemplate,
} from '@hr/stores/shift-template-store';
import ShiftTemplateEditDialog from './ShiftTemplateEditDialog.vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
}>();

const $q = useQuasar();
const shiftTemplateStore = useShiftTemplateStore();

const showEditDialog = ref(false);
const editingTemplate = ref<ShiftTemplate | null>(null);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      void shiftTemplateStore.fetchTemplates({ activeOnly: false });
    }
  },
);

function formatSegments(template: ShiftTemplate): string {
  return template.segments
    .map((segment) => `${segment.start_time}–${segment.end_time}`)
    .join(' / ');
}

function openCreate() {
  editingTemplate.value = null;
  showEditDialog.value = true;
}

function openEdit(template: ShiftTemplate) {
  editingTemplate.value = template;
  showEditDialog.value = true;
}

function onSaved() {
  void shiftTemplateStore.fetchTemplates({ activeOnly: false });
}

function confirmDelete(template: ShiftTemplate) {
  $q.dialog({
    title: 'Delete shift template',
    message: `Delete “${shiftTemplateDisplayLabel(template)}”?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      const ok = await shiftTemplateStore.deleteTemplate(template.id);
      $q.notify({
        type: ok ? 'positive' : 'negative',
        message: ok
          ? 'Shift template deleted.'
          : shiftTemplateStore.error || 'Unable to delete shift template.',
      });
    })();
  });
}
</script>

<style scoped>
.shift-template-manage-card {
  width: min(520px, 100vw);
}
</style>

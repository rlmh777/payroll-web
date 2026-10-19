<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <AppDialogCard modal>
      <AppDialogHeader>
        <div>
          <div class="text-h6">Interview panel</div>
          <div class="text-caption text-grey-7">{{ vacancy?.title }}</div>
        </div>
      </AppDialogHeader>
      <AppDialogBody>
        <InterviewSetup v-if="modelValue && vacancy" :vacancy-id="vacancy.id" />
      </AppDialogBody>
      <AppDialogActions>
        <q-btn v-close-popup flat label="Close" />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import InterviewSetup from '@hr/components/vacancies/InterviewSetup.vue';
import type { Vacancy } from '@hr/stores/vacancy-store';

defineProps<{
  modelValue: boolean;
  vacancy?: Vacancy | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();
</script>

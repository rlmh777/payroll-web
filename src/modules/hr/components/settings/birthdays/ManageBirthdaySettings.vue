<template>
  <q-page class="q-pa-md">
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6">Birthday visibility</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Controls which birthdays appear on the Employee dashboard upcoming events.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-inner-loading :showing="store.isLoading">
          <q-spinner color="primary" size="32px" />
        </q-inner-loading>

        <q-form class="q-gutter-md" @submit.prevent="save">
          <q-option-group
            v-model="form.birthdayVisibility"
            :options="options"
            color="primary"
            :disable="store.isLoading || store.isSaving"
          />

          <div class="row q-gutter-sm">
            <q-btn
              color="primary"
              label="Save"
              type="submit"
              :loading="store.isSaving"
              :disable="store.isLoading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, watch } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import {
  useHrSettingStore,
  type BirthdayVisibility,
} from '@hr/stores/hr-setting-store';

defineProps<{ title?: string }>();

const $q = useQuasar();
const store = useHrSettingStore();
const { settings } = storeToRefs(store);

const form = reactive({
  birthdayVisibility: 'company' as BirthdayVisibility,
});

const options = [
  { label: 'Company wide — everyone sees upcoming birthdays', value: 'company' },
  { label: 'Department only — birthdays are limited to the employee’s department', value: 'department' },
  { label: 'Not at all — hide birthdays from the Employee dashboard', value: 'none' },
];

watch(
  settings,
  (value) => {
    if (value?.birthdayVisibility) {
      form.birthdayVisibility = value.birthdayVisibility;
    }
  },
  { immediate: true },
);

async function save() {
  try {
    await store.saveSettings({ birthdayVisibility: form.birthdayVisibility });
    $q.notify({ type: 'positive', message: 'Birthday visibility saved.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save birthday visibility.',
    });
  }
}

onMounted(() => {
  void store.fetchSettings();
});
</script>

<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    position="right"
  >
    <q-card class="q-drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ editing.id ? 'Edit' : 'New' }} Country</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeDrawer" :disable="saving" />
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <q-form @submit.prevent="save" class="q-gutter-md">
          <q-input
            v-model="editing.name"
            label="Name *"
            dense
            outlined
            :rules="[(val) => !!val || 'Name is required']"
            :disable="saving"
          />
          <q-input v-model="editing.code1" label="Code 1" dense outlined :disable="saving" />
          <q-input v-model="editing.code2" label="Code 2" dense outlined :disable="saving" />
          <q-input
            v-model="editing.nationalityName"
            label="Nationality Name"
            dense
            outlined
            :disable="saving"
          />

          <q-card-actions align="right" class="q-pt-md">
            <q-btn flat label="Cancel" color="grey" @click="closeDrawer" :disable="saving" />
            <q-btn
              :loading="saving"
              color="primary"
              :label="editing.id ? 'Save Changes' : 'Save'"
              type="submit"
            />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useCountryStore } from '../../../../stores/country-store';
import type { Country } from '../../../../components/models';

const store = useCountryStore();
const $q = useQuasar();
// Define Props and Emits using TypeScript interface style
interface Props {
  modelValue: boolean; // Controls dialog visibility
  countryToEdit: Partial<Country> | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue', 'saved']);

// Local form state
const editing = ref<Partial<Country>>({});
const saving = ref(false);

// Watch the prop and update the local state when it changes.
watch(
  () => props.countryToEdit,
  (newVal) => {
    // Safely reset and populate the form data
    editing.value = newVal ? { ...newVal } : {};
  },
  { immediate: true, deep: true }, // Added deep for consistency, though shallow copy is often enough
);

function closeDrawer() {
  emit('update:modelValue', false);
  // Reset local state after closing
  editing.value = {};
}

async function save() {
  if (!editing.value.name) return;
  saving.value = true;
  try {
    // 1. Define the base payload with required/guaranteed fields
    const payload: Partial<Country> = {
      name: editing.value.name,
    };

    // 2. Only add optional fields if they are explicitly present (not null/undefined/empty string)
    //    This ensures the properties are omitted if they don't have a value, satisfying exactOptionalPropertyTypes.
    if (editing.value.code1) {
      payload.code1 = editing.value.code1;
    }
    if (editing.value.code2) {
      payload.code2 = editing.value.code2;
    }
    if (editing.value.nationalityName) {
      payload.nationalityName = editing.value.nationalityName;
    }

    if (editing.value.id) {
      // Update logic
      await store.updateCountry(editing.value.id, payload);
    } else {
      // Create logic
      // Note: We cast to <Country> if the API requires a non-partial type for creation
      await store.createCountry(payload as Country);
    }

    //Success Notification
    $q.notify({
      color: 'positive',
      position: 'top',
      icon: 'check_circle',
      message: editing.value.id ? 'Country updated successfully!' : 'Country created successfully!',
      timeout: 2500,
    });

    closeDrawer();
    emit('saved');
  } catch (error) {
    // 4. Error Notification (Highly Recommended)
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'warning',
      message: `Failed to save country ${String(error)}. Please try again.`,
      timeout: 5000,
    });
    console.error('An error occurred during save:', error);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.q-drawer-card {
  width: 30vw;
  max-width: 400px;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}
/* Ensure the styling targets nested elements correctly for scrolling */
.q-drawer-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

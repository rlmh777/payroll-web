<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="add-record-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add Weekly Record</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model.number="form.weeklyEarningsStartRange"
            label="Weekly Earnings Start Range *"
            type="number"
            step="0.01"
            min="0"
            outlined
            :rules="[val => val !== null && val !== undefined && val >= 0 || 'Start range is required']"
            :disable="socialSecurityStore.isLoading"
          />

          <q-input
            v-model.number="form.weeklyEarningsEndRange"
            label="Weekly Earnings End Range *"
            type="number"
            step="0.01"
            min="0"
            outlined
            :rules="[
              val => val !== null && val !== undefined && val >= 0 || 'End range is required',
              val => form.weeklyEarningsStartRange === null || val >= form.weeklyEarningsStartRange || 'End range must be greater than or equal to start range'
            ]"
            :disable="socialSecurityStore.isLoading"
          />

          <q-input
            v-model.number="form.weeklyInsurableEarnings"
            label="Weekly Insurable Earnings *"
            type="number"
            step="0.01"
            min="0"
            outlined
            :rules="[val => val !== null && val !== undefined && val >= 0 || 'Insurable earnings is required']"
            :disable="socialSecurityStore.isLoading"
          />

          <q-input
            v-model.number="form.weeklyEmployeeContributions"
            label="Weekly Employee Contributions *"
            type="number"
            step="0.01"
            min="0"
            outlined
            :rules="[val => val !== null && val !== undefined && val >= 0 || 'Employee contributions is required']"
            :disable="socialSecurityStore.isLoading"
          />

          <q-input
            v-model.number="form.weeklyEmployerContributions"
            label="Weekly Employer Contributions *"
            type="number"
            step="0.01"
            min="0"
            outlined
            :rules="[val => val !== null && val !== undefined && val >= 0 || 'Employer contributions is required']"
            :disable="socialSecurityStore.isLoading"
          />

          <q-input
            v-model.number="form.weekyEmployeeContributionsRate"
            label="Employee Contributions Rate (%) *"
            type="number"
            step="0.01"
            min="0"
            max="100"
            outlined
            :rules="[val => val !== null && val !== undefined && val >= 0 && val <= 100 || 'Employee rate is required (0-100)']"
            :disable="socialSecurityStore.isLoading"
          />

          <q-input
            v-model.number="form.weeklyEmployerContributionsRate"
            label="Employer Contributions Rate (%) *"
            type="number"
            step="0.01"
            min="0"
            max="100"
            outlined
            :rules="[val => val !== null && val !== undefined && val >= 0 && val <= 100 || 'Employer rate is required (0-100)']"
            :disable="socialSecurityStore.isLoading"
          />

          <q-input
            v-model.number="form.maxWeeklyShortTermBenefit"
            label="Max Weekly Short Term Benefit *"
            type="number"
            step="0.01"
            min="0"
            outlined
            :rules="[val => val !== null && val !== undefined && val >= 0 || 'Max short term benefit is required']"
            :disable="socialSecurityStore.isLoading"
          />

          <q-input
            v-model.number="form.maxWeeklyPensions"
            label="Max Weekly Pensions *"
            type="number"
            step="0.01"
            min="0"
            outlined
            :rules="[val => val !== null && val !== undefined && val >= 0 || 'Max weekly pensions is required']"
            :disable="socialSecurityStore.isLoading"
          />

          <q-input
            v-model.number="form.maxYearlyPension"
            label="Max Yearly Pension *"
            type="number"
            step="0.01"
            min="0"
            outlined
            :rules="[val => val !== null && val !== undefined && val >= 0 || 'Max yearly pension is required']"
            :disable="socialSecurityStore.isLoading"
          />

          <q-select
            v-model="form.state"
            :options="stateOptions"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            outlined
            label="State"
            :disable="socialSecurityStore.isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="socialSecurityStore.isLoading"
            />
            <q-btn
              type="submit"
              label="Save"
              color="primary"
              :loading="socialSecurityStore.isLoading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useSocialSecurityStore } from '../../../stores/social-security-store';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'saved': [recordId: string];
}>();

const socialSecurityStore = useSocialSecurityStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const stateOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const form = ref({
  weeklyEarningsStartRange: null as number | null,
  weeklyEarningsEndRange: null as number | null,
  weeklyInsurableEarnings: null as number | null,
  weeklyEmployeeContributions: null as number | null,
  weeklyEmployerContributions: null as number | null,
  weekyEmployeeContributionsRate: null as number | null,
  weeklyEmployerContributionsRate: null as number | null,
  maxWeeklyShortTermBenefit: null as number | null,
  maxWeeklyPensions: null as number | null,
  maxYearlyPension: null as number | null,
  state: 'active' as 'active' | 'inactive',
});

const onSubmit = async () => {
  if (
    form.value.weeklyEarningsStartRange === null ||
    form.value.weeklyEarningsEndRange === null ||
    form.value.weeklyInsurableEarnings === null ||
    form.value.weeklyEmployeeContributions === null ||
    form.value.weeklyEmployerContributions === null ||
    form.value.weekyEmployeeContributionsRate === null ||
    form.value.weeklyEmployerContributionsRate === null ||
    form.value.maxWeeklyShortTermBenefit === null ||
    form.value.maxWeeklyPensions === null ||
    form.value.maxYearlyPension === null
  ) {
    return;
  }

  try {
    const newRecord = await socialSecurityStore.createSocialSecurity(
      form.value.weeklyEarningsStartRange,
      form.value.weeklyEarningsEndRange,
      form.value.weeklyInsurableEarnings,
      form.value.weeklyEmployeeContributions,
      form.value.weeklyEmployerContributions,
      form.value.weekyEmployeeContributionsRate,
      form.value.weeklyEmployerContributionsRate,
      form.value.maxWeeklyShortTermBenefit,
      form.value.maxWeeklyPensions,
      form.value.maxYearlyPension,
      form.value.state
    );

    if (newRecord) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Weekly record created successfully!',
      });
      emit('saved', newRecord.id);
      onClose();
    } else if (socialSecurityStore.error) {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'error',
        message: socialSecurityStore.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create weekly record';
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: errorMessage,
    });
  }
};

const onClose = () => {
  form.value = {
    weeklyEarningsStartRange: null,
    weeklyEarningsEndRange: null,
    weeklyInsurableEarnings: null,
    weeklyEmployeeContributions: null,
    weeklyEmployerContributions: null,
    weekyEmployeeContributionsRate: null,
    weeklyEmployerContributionsRate: null,
    maxWeeklyShortTermBenefit: null,
    maxWeeklyPensions: null,
    maxYearlyPension: null,
    state: 'active',
  };
  isOpen.value = false;
};

// Reset form when dialog opens
watch(isOpen, (newValue) => {
  if (newValue) {
    form.value = {
      weeklyEarningsStartRange: null,
      weeklyEarningsEndRange: null,
      weeklyInsurableEarnings: null,
      weeklyEmployeeContributions: null,
      weeklyEmployerContributions: null,
      weekyEmployeeContributionsRate: null,
      weeklyEmployerContributionsRate: null,
      maxWeeklyShortTermBenefit: null,
      maxWeeklyPensions: null,
      maxYearlyPension: null,
      state: 'active',
    };
  }
});
</script>

<style scoped>
.add-record-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.add-record-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>


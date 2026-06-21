<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="edit-record-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Weekly Record</div>
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
              label="Update"
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
import { useSocialSecurityStore, type SocialSecurity } from '../../../stores/social-security-store';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
  record: SocialSecurity | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  record: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updated': [recordId: string];
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
  if (!props.record) return;

  try {
    const updatedRecord = await socialSecurityStore.updateSocialSecurity(
      props.record.id,
      form.value.weeklyEarningsStartRange ?? undefined,
      form.value.weeklyEarningsEndRange ?? undefined,
      form.value.weeklyInsurableEarnings ?? undefined,
      form.value.weeklyEmployeeContributions ?? undefined,
      form.value.weeklyEmployerContributions ?? undefined,
      form.value.weekyEmployeeContributionsRate ?? undefined,
      form.value.weeklyEmployerContributionsRate ?? undefined,
      form.value.maxWeeklyShortTermBenefit ?? undefined,
      form.value.maxWeeklyPensions ?? undefined,
      form.value.maxYearlyPension ?? undefined,
      form.value.state
    );

    if (updatedRecord) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Weekly record updated successfully!',
      });
      emit('updated', updatedRecord.id);
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to update weekly record';
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: errorMessage,
    });
  }
};

const onClose = () => {
  isOpen.value = false;
};

// Load record data when dialog opens
watch(isOpen, (newValue) => {
  if (newValue && props.record) {
    form.value = {
      weeklyEarningsStartRange: props.record.weeklyEarningsStartRange,
      weeklyEarningsEndRange: props.record.weeklyEarningsEndRange,
      weeklyInsurableEarnings: props.record.weeklyInsurableEarnings,
      weeklyEmployeeContributions: props.record.weeklyEmployeeContributions,
      weeklyEmployerContributions: props.record.weeklyEmployerContributions,
      weekyEmployeeContributionsRate: props.record.weekyEmployeeContributionsRate,
      weeklyEmployerContributionsRate: props.record.weeklyEmployerContributionsRate,
      maxWeeklyShortTermBenefit: props.record.maxWeeklyShortTermBenefit,
      maxWeeklyPensions: props.record.maxWeeklyPensions,
      maxYearlyPension: props.record.maxYearlyPension,
      state: props.record.state,
    };
  }
});
</script>

<style scoped>
.edit-record-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.edit-record-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>


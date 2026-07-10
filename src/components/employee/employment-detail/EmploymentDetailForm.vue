<template>
  <div class="employment-detail-form">
    <div class="employment-detail-form__row employment-detail-form__row--2">
      <SsBenefitDateField
        v-model="model.startDate"
        label="Start date *"
        required
        :disable="props.disable"
      />
      <SsBenefitDateField
        v-model="model.endDate"
        label="End date"
        clearable
        :disable="props.disable"
      />
    </div>

    <q-toggle v-model="model.isActive" label="Active contract" :disable="props.disable" />

    <q-input
      v-model="model.jobTitle"
      label="Job title"
      dense
      outlined
      maxlength="255"
      :disable="props.disable"
    />

    <q-toggle
      v-model="model.requiresClocking"
      label="Requires clock in/out"
      hint="Track attendance for this assignment."
      :disable="props.disable"
    />

    <div class="employment-detail-form__row employment-detail-form__row--2">
      <DepartmentSelect v-model="model.departmentId" label="Department *" :disable="props.disable" />
      <WorksiteSelect v-model="model.worksiteId" label="Worksite *" :disable="props.disable" />
    </div>

    <div class="employment-detail-form__row employment-detail-form__row--2">
      <ContractTypeSelect v-model="model.contractTypeId" :disable="props.disable" />
      <PayPeriodGroupSelect
        v-model="model.defaultPayPeriodGroupId"
        label="Pay period group *"
        :clearable="false"
        :disable="props.disable"
      />
    </div>

    <AccountSelect v-model="model.accountId" :disable="props.disable" show-add-new show-edit />

    <div class="employment-detail-form__field-group">
      <q-file
        v-model="model.contractAgreementFile"
        label="Contract agreement"
        hint="Optional. PDF or Word document."
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        dense
        outlined
        clearable
        :disable="props.disable"
      >
        <template #prepend>
          <q-icon name="upload_file" />
        </template>
      </q-file>
      <div v-if="existingContractName && !model.contractAgreementFile" class="text-caption text-grey-7">
        Current file: {{ existingContractName }}
      </div>
    </div>

    <q-input
      v-model="model.employmentPolicies"
      type="textarea"
      label="Employment policies"
      dense
      outlined
      :disable="props.disable"
    />

    <q-input
      v-model="model.benefits"
      type="textarea"
      label="Benefits"
      dense
      outlined
      :disable="props.disable"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SsBenefitDateField from 'src/components/employee/ss-benefit/SsBenefitDateField.vue';
import AccountSelect from 'src/components/employee/common/AccountSelect.vue';
import ContractTypeSelect from 'src/components/contract-type/ContractTypeSelect.vue';
import DepartmentSelect from 'src/components/department/DepartmentSelect.vue';
import WorksiteSelect from 'src/components/worksite/WorksiteSelect.vue';
import PayPeriodGroupSelect from 'src/components/payroll/pay-period-groups/PayPeriodGroupSelect.vue';
import {
  contractAgreementFileName,
  type EmploymentDetailFormModel,
} from './employment-detail-form';

const props = withDefaults(defineProps<{
  disable?: boolean;
}>(), {
  disable: false,
});

const model = defineModel<EmploymentDetailFormModel>({ required: true });

const existingContractName = computed(() => contractAgreementFileName(model.value.contractAgreementPath));
</script>

<style scoped>
.employment-detail-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.employment-detail-form__row {
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr;
}

@media (min-width: 600px) {
  .employment-detail-form__row--2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.employment-detail-form__field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>

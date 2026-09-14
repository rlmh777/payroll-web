<template>
    <div>
        <div class="row q-gutter-x-lg q-gutter-y-md">
            <div v-if="isFieldVisible('code')" class="col-3 col-md-2">
                <q-input
                    v-model="employeeCode"
                    label="Employee Code"
                    :readonly="isCreating || isFieldReadonly('code', isCreating)"
                    :hint="isCreating ? 'Auto-generated from name and date' : undefined"
                    persistent-hint
                >
                    <template v-if="isCreating && canWriteField('code', true)" #append>
                        <q-btn
                            flat
                            dense
                            round
                            icon="refresh"
                            color="primary"
                            @click="regenerateCode"
                        >
                            <q-tooltip>Regenerate code</q-tooltip>
                        </q-btn>
                    </template>
                </q-input>
            </div>
            <div v-if="isFieldVisible('honorificId')" class="col-3 col-md-2">
                <HonorificSelect
                    v-model="honorific"
                    :employeeHonorific="employeeStore.selectedEmployee?.honorific?.name || ''"
                    :readonly="isFieldReadonly('honorificId', isCreating)"
                />
            </div>
            <div v-if="isFieldVisible('firstName')" class="col-3 col-md-2">
                <q-input
                    v-model="firstName"
                    label="First Name"
                    :readonly="isFieldReadonly('firstName', isCreating)"
                />
            </div>
            <div v-if="isFieldVisible('lastName')" class="col-3 col-md-2">
                <q-input
                    v-model="lastName"
                    label="Last Name"
                    :readonly="isFieldReadonly('lastName', isCreating)"
                />
            </div>
            <div v-if="isFieldVisible('middleName')" class="col-3 col-md-2">
                <q-input
                    v-model="middleName"
                    label="Middle Name"
                    :readonly="isFieldReadonly('middleName', isCreating)"
                />
            </div>
            <div v-if="isFieldVisible('maidenName')" class="col-3 col-md-2">
                <q-input
                    v-model="maidenName"
                    label="Maiden Name"
                    :readonly="isFieldReadonly('maidenName', isCreating)"
                />
            </div>
            <div v-if="isFieldVisible('birthdate')" class="col-3 col-md-2">
                <SsBenefitDateField
                    v-model="birthdate"
                    label="Birthdate"
                    clearable
                    :disable="isFieldReadonly('birthdate', isCreating)"
                />
            </div>
            <div v-if="isFieldVisible('socialSecurityNumber')" class="col-3 col-md-2">
                <q-input
                    v-model="socialSecurityNumber"
                    label="Social Security Number"
                    :readonly="isFieldReadonly('socialSecurityNumber', isCreating)"
                />
            </div>
            <div v-if="isFieldVisible('socialSecurityExpirationDate')" class="col-3 col-md-2">
                <SsBenefitDateField
                    v-model="socialSecurityExpirationDate"
                    label="SS Expiration Date"
                    clearable
                    :disable="isFieldReadonly('socialSecurityExpirationDate', isCreating)"
                />
            </div>
            <div v-if="isFieldVisible('passportNumber')" class="col-3 col-md-2">
                <q-input
                    v-model="passportNumber"
                    label="Passport Number"
                    :readonly="isFieldReadonly('passportNumber', isCreating)"
                />
            </div>
            <div v-if="isFieldVisible('votersId')" class="col-3 col-md-2">
                <q-input
                    v-model="votersId"
                    label="Voters ID"
                    :readonly="isFieldReadonly('votersId', isCreating)"
                />
            </div>
            <div v-if="isFieldVisible('taxIdentificationNumber')" class="col-3 col-md-2">
                <q-input
                    v-model="taxIdentificationNumber"
                    label="Tax Identification Number"
                    :readonly="isFieldReadonly('taxIdentificationNumber', isCreating)"
                />
            </div>
            <div v-if="isFieldVisible('phone')" class="col-3 col-md-2">
                <q-input
                    v-model="phone"
                    label="Phone"
                    :readonly="isFieldReadonly('phone', isCreating)"
                />
            </div>
            <div v-if="isFieldVisible('email')" class="col-3 col-md-2">
                <q-input
                    v-model="email"
                    label="Email"
                    type="email"
                    :readonly="isFieldReadonly('email', isCreating)"
                />
            </div>
            <div v-if="isFieldVisible('genderId')" class="col-3 col-md-2">
                <GenderSelect
                    v-model="gender"
                    :disable="isFieldReadonly('genderId', isCreating)"
                />
            </div>
            <div v-if="isFieldVisible('nationalityId')" class="col-3 col-md-2">
                <NationalitySelect
                    v-model="nationality"
                    :employeeNationality="employeeStore.selectedEmployee?.nationality?.nationalityName || ''"
                    :readonly="isFieldReadonly('nationalityId', isCreating)"
                />
            </div>
            <div v-if="isFieldVisible('citizenshipStatusId')" class="col-3 col-md-2">
                <CitizenshipStatusSelect
                    v-model="citizenshipStatus"
                    :employeeCitizenshipStatus="employeeStore.selectedEmployee?.citizenshipStatus?.name || ''"
                    :readonly="isFieldReadonly('citizenshipStatusId', isCreating)"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useEmployeeStore } from '@/stores/employee-store';
import { useEmployeeFormAccess } from '@core/composables/useEmployeeFormAccess';
import { generateEmployeeCode } from '@hr/utils/employee-code';
import GenderSelect from './GenderSelect.vue';
import HonorificSelect from './HonorificSelect.vue';
import NationalitySelect from './NationalitySelect.vue';
import CitizenshipStatusSelect from './CitizenshipStatusSelect.vue';
import SsBenefitDateField from '@payroll/components/employee/ss-benefit/SsBenefitDateField.vue';

const employeeStore = useEmployeeStore();
const {
  isFieldVisible,
  isFieldReadonly,
  canWriteField,
} = useEmployeeFormAccess();
const isCreating = computed(() => !employeeStore.selectedEmployee?.id);

const employeeCode = computed({
    get: () => employeeStore.selectedEmployee?.code || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee && canWriteField('code', isCreating.value)) {
            employeeStore.selectedEmployee.code = value;
        }
    }
});

function regenerateCode() {
    if (!employeeStore.selectedEmployee || !canWriteField('code', isCreating.value)) {
        return;
    }
    employeeStore.selectedEmployee.code = generateEmployeeCode(
        employeeStore.selectedEmployee.firstName || '',
        employeeStore.selectedEmployee.lastName || '',
    );
}

function setField<K extends keyof NonNullable<typeof employeeStore.selectedEmployee>>(
  field: K & string,
  value: NonNullable<typeof employeeStore.selectedEmployee>[K],
) {
  if (!employeeStore.selectedEmployee || !canWriteField(field, isCreating.value)) {
    return;
  }
  employeeStore.selectedEmployee[field] = value;
}

const firstName = computed({
    get: () => employeeStore.selectedEmployee?.firstName || '',
    set: (value: string) => setField('firstName', value),
});

const lastName = computed({
    get: () => employeeStore.selectedEmployee?.lastName || '',
    set: (value: string) => setField('lastName', value),
});

watch([firstName, lastName], ([nextFirst, nextLast]) => {
    if (!isCreating.value || !employeeStore.selectedEmployee || !canWriteField('code', true)) {
        return;
    }
    if (!nextFirst.trim() && !nextLast.trim()) {
        employeeStore.selectedEmployee.code = '';
        return;
    }
    employeeStore.selectedEmployee.code = generateEmployeeCode(nextFirst, nextLast);
});

const middleName = computed({
    get: () => employeeStore.selectedEmployee?.middleName || '',
    set: (value: string) => setField('middleName', value || null),
});

const maidenName = computed({
    get: () => employeeStore.selectedEmployee?.maidenName || '',
    set: (value: string) => setField('maidenName', value || null),
});

const birthdate = computed({
    get: () => employeeStore.selectedEmployee?.birthdate || null,
    set: (value: string | null) => setField('birthdate', value || ''),
});

const socialSecurityNumber = computed({
    get: () => employeeStore.selectedEmployee?.socialSecurityNumber || '',
    set: (value: string) => setField('socialSecurityNumber', value || ''),
});

const socialSecurityExpirationDate = computed({
    get: () => employeeStore.selectedEmployee?.socialSecurityExpirationDate || null,
    set: (value: string | null) => setField('socialSecurityExpirationDate', value || null),
});

const passportNumber = computed({
    get: () => employeeStore.selectedEmployee?.passportNumber || '',
    set: (value: string) => setField('passportNumber', value || null),
});

const taxIdentificationNumber = computed({
    get: () => employeeStore.selectedEmployee?.taxIdentificationNumber || '',
    set: (value: string) => setField('taxIdentificationNumber', value || null),
});

const votersId = computed({
    get: () => employeeStore.selectedEmployee?.votersId || '',
    set: (value: string) => setField('votersId', value || null),
});

const phone = computed({
    get: () => employeeStore.selectedEmployee?.phone || '',
    set: (value: string) => setField('phone', value || null),
});

const email = computed({
    get: () => employeeStore.selectedEmployee?.email || '',
    set: (value: string) => setField('email', value || null),
});

const gender = computed({
    get: () => employeeStore.selectedEmployee?.genderId || null,
    set: (value: number) => setField('genderId', value || null),
});

const honorific = computed({
    get: () => employeeStore.selectedEmployee?.honorificId || null,
    set: (value: number | null) => setField('honorificId', value || null),
});

const nationality = computed({
    get: () => employeeStore.selectedEmployee?.nationalityId || '',
    set: (value: string) => setField('nationalityId', value || null),
});

const citizenshipStatus = computed({
    get: () => employeeStore.selectedEmployee?.citizenshipStatusId || null,
    set: (value: number | null) => setField('citizenshipStatusId', value || null),
});
</script>

<style scoped>

</style>

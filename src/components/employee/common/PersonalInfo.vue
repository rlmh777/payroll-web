<template>
    <div>
        <div class="row">
            <div class="col-12 text-subtitle1 text-weight-medium">
                Personal Info
            </div>
        </div>
        <div class="row q-gutter-x-lg q-gutter-y-sm">
            <div class="col-3 col-md-2">
                <q-input v-model="firstName" label="First Name" />
            </div>
            <div class="col-3 col-md-2">
                <q-input v-model="lastName" label="Last Name" />
            </div>
            <div class="col-3 col-md-2">
                <q-input v-model="middleName" label="Middle Name" />
            </div>
            <div class="col-3 col-md-2">
                <q-input v-model="maidenName" label="Maiden Name" />
            </div>
            <div class="col-3 col-md-2">
                <q-input v-model="birthdate" label="Birthdate" type="date" />
            </div>
            <div class="col-3 col-md-2">
                <q-input v-model="socialSecurityNumber" label="Social Security Number" />
            </div>
                <div class="col-3 col-md-2">
                <q-input v-model="passportNumber" label="Passport Number" />
            </div>
            <div class="col-3 col-md-2">
                <q-input v-model="taxIdentificationNumber" label="Tax Identification Number" />
            </div>
            <div class="col-3 col-md-2">
                <q-input v-model="phone" label="Phone" />
            </div>
            <div class="col-3 col-md-2">
                <q-input v-model="email" label="Email" type="email" />
            </div>
            <div class="col-3 col-md-2">
                <GenderSelect v-model="gender" />
            </div>
            <div class="col-3 col-md-2">
                <NationalitySelect 
                    v-model="nationality" 
                    :employeeNationality="employeeStore.selectedEmployee?.nationality?.nationalityName || ''"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useEmployeeStore } from '../../../stores/employee-store';
import GenderSelect from './GenderSelect.vue';
import NationalitySelect from './NationalitySelect.vue';

const employeeStore = useEmployeeStore();

// Computed properties with getters and setters for two-way binding
const firstName = computed({
    get: () => employeeStore.selectedEmployee?.firstName || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee) {
            employeeStore.selectedEmployee.firstName = value;
        }
    }
});

const lastName = computed({
    get: () => employeeStore.selectedEmployee?.lastName || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee) {
            employeeStore.selectedEmployee.lastName = value;
        }
    }
});

const middleName = computed({
    get: () => employeeStore.selectedEmployee?.middleName || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee) {
            employeeStore.selectedEmployee.middleName = value || null;
        }
    }
});

const maidenName = computed({
    get: () => employeeStore.selectedEmployee?.maidenName || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee) {
            employeeStore.selectedEmployee.maidenName = value || null;
        }
    }
});

const birthdate = computed({
    get: () => employeeStore.selectedEmployee?.birthdate || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee) {
            employeeStore.selectedEmployee.birthdate = value || '';
        }
    }
});

const socialSecurityNumber = computed({
    get: () => employeeStore.selectedEmployee?.socialSecurityNumber || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee) {
            employeeStore.selectedEmployee.socialSecurityNumber = value || '';
        }
    }
});

const passportNumber = computed({
    get: () => employeeStore.selectedEmployee?.passportNumber || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee) {
            employeeStore.selectedEmployee.passportNumber = value || null;
        }
    }
});

const taxIdentificationNumber = computed({
    get: () => employeeStore.selectedEmployee?.taxIdentificationNumber || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee) {
            employeeStore.selectedEmployee.taxIdentificationNumber = value || null;
        }
    }
});

const phone = computed({
    get: () => employeeStore.selectedEmployee?.phone || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee) {
            employeeStore.selectedEmployee.phone = value || null;
        }
    }
});

const email = computed({
    get: () => employeeStore.selectedEmployee?.email || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee) {
            employeeStore.selectedEmployee.email = value || null;
        }
    }
});

const gender = computed({
    get: () => employeeStore.selectedEmployee?.genderId || null,
    set: (value: number) => {
        if (employeeStore.selectedEmployee) {
            employeeStore.selectedEmployee.genderId = value || null;
        }
    }
});

const nationality = computed({
    get: () => employeeStore.selectedEmployee?.nationalityId || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee) {
            employeeStore.selectedEmployee.nationalityId = value || null;
        }
    }
});
</script>

<style scoped>

</style>
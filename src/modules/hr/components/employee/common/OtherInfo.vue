<template>
    <div>
        <div class="row q-gutter-x-lg q-gutter-y-sm">
            <div class="col-12 col-md-3">
                <q-input v-model="address1" label="Address 1" />
            </div>
            <div class="col-12 col-md-3">
                <q-input v-model="address2" label="Address 2" />
            </div>
            <div class="col-12 col-md-3">
                <LocalitySelect 
                    v-model="locality" 
                    :employeeLocality="employeeStore.selectedEmployee?.locality?.name || ''"
                />
            </div>
            <div class="col-12 col-md-6">
                <q-input v-model="unionMembership" label="Union Membership" />
            </div>
            <div class="col-12">
                Health:
                <q-editor v-model="health" label="Health" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useEmployeeStore } from '@/stores/employee-store';
import LocalitySelect from './LocalitySelect.vue';

const employeeStore = useEmployeeStore();

const address1 = computed({
    get: () => employeeStore.selectedEmployee?.address1 || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee) {
            employeeStore.selectedEmployee.address1 = value;
        }
    }
});

const address2 = computed({
    get: () => employeeStore.selectedEmployee?.address2 || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee) {
            employeeStore.selectedEmployee.address2 = value || null;
        }
    }
});

const locality = computed({
    get: () => employeeStore.selectedEmployee?.localityId || '',
    set: (value: string | null) => {
        if (employeeStore.selectedEmployee) {
            employeeStore.selectedEmployee.localityId = value || '';
        }
    }
});

const unionMembership = computed({
    get: () => employeeStore.selectedEmployee?.unionMembership || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee) {
            employeeStore.selectedEmployee.unionMembership = value || null;
        }
    }
});

const health = computed({
    get: () => employeeStore.selectedEmployee?.health || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee) {
            employeeStore.selectedEmployee.health = value || null;
        }
    }
});
</script>

<style scoped>
</style>
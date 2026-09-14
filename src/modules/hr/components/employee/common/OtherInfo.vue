<template>
    <div>
        <div class="row q-gutter-x-lg q-gutter-y-sm">
            <div v-if="isFieldVisible('address1')" class="col-12 col-md-3">
                <q-input
                    v-model="address1"
                    label="Address 1"
                    :readonly="isFieldReadonly('address1', isCreating)"
                />
            </div>
            <div v-if="isFieldVisible('address2')" class="col-12 col-md-3">
                <q-input
                    v-model="address2"
                    label="Address 2"
                    :readonly="isFieldReadonly('address2', isCreating)"
                />
            </div>
            <div v-if="isFieldVisible('localityId')" class="col-12 col-md-3">
                <LocalitySelect
                    v-model="locality"
                    :employeeLocality="employeeStore.selectedEmployee?.locality?.name || ''"
                    :readonly="isFieldReadonly('localityId', isCreating)"
                />
            </div>
            <div v-if="isFieldVisible('unionMembership')" class="col-12 col-md-6">
                <q-input
                    v-model="unionMembership"
                    label="Union Membership"
                    :readonly="isFieldReadonly('unionMembership', isCreating)"
                />
            </div>
            <div v-if="isFieldVisible('health')" class="col-12">
                Health:
                <q-editor
                    v-model="health"
                    label="Health"
                    :disable="isFieldReadonly('health', isCreating)"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useEmployeeStore } from '@/stores/employee-store';
import { useEmployeeFormAccess } from '@core/composables/useEmployeeFormAccess';
import LocalitySelect from './LocalitySelect.vue';

const employeeStore = useEmployeeStore();
const { isFieldVisible, isFieldReadonly, canWriteField } = useEmployeeFormAccess();
const isCreating = computed(() => !employeeStore.selectedEmployee?.id);

const address1 = computed({
    get: () => employeeStore.selectedEmployee?.address1 || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee && canWriteField('address1', isCreating.value)) {
            employeeStore.selectedEmployee.address1 = value;
        }
    }
});

const address2 = computed({
    get: () => employeeStore.selectedEmployee?.address2 || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee && canWriteField('address2', isCreating.value)) {
            employeeStore.selectedEmployee.address2 = value || null;
        }
    }
});

const locality = computed({
    get: () => employeeStore.selectedEmployee?.localityId || '',
    set: (value: string | null) => {
        if (employeeStore.selectedEmployee && canWriteField('localityId', isCreating.value)) {
            employeeStore.selectedEmployee.localityId = value || '';
        }
    }
});

const unionMembership = computed({
    get: () => employeeStore.selectedEmployee?.unionMembership || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee && canWriteField('unionMembership', isCreating.value)) {
            employeeStore.selectedEmployee.unionMembership = value || null;
        }
    }
});

const health = computed({
    get: () => employeeStore.selectedEmployee?.health || '',
    set: (value: string) => {
        if (employeeStore.selectedEmployee && canWriteField('health', isCreating.value)) {
            employeeStore.selectedEmployee.health = value || null;
        }
    }
});
</script>

<style scoped>
</style>

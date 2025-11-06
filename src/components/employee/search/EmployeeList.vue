<template>
    <div class="row q-gutter-md">
        <div
            v-for="employee in employees"
            :key="employee.id"
            class="col-12"
        >
            <q-card class="employee-card">
                <div class="employee-card-header">
                    <GenderIcon :gender="employee.gender ?? null" />
                </div>
                
                <q-card-section class="employee-info-section">
                    <div class="row items-center">
                        <q-avatar
                            color="primary"
                            text-color="white"
                            size="48px"
                            class="q-mr-md"
                            font-size="20px"
                        >
                            {{ getInitial(employee.lastName) }}
                        </q-avatar>
                        <div class="col">
                            <div class="text-h6 text-weight-medium q-mb-xs">
                                {{ employee.firstName }} {{ employee.lastName }}
                            </div>
                            <div class="text-caption text-grey-7">
                                <span class="copyable-field-container">
                                    <span>{{ employee.code }}</span>
                                    <q-icon
                                        name="content_copy"
                                        size="14px"
                                        class="copy-icon"
                                        @click.stop="copyToClipboard(employee.code, 'Code')"
                                    />
                                </span>
                                <span class="q-mx-xs">•</span>
                                <span class="copyable-field-container">
                                    <span>{{ employee.socialSecurityNumber }}</span>
                                    <q-icon
                                        name="content_copy"
                                        size="14px"
                                        class="copy-icon"
                                        @click.stop="copyToClipboard(employee.socialSecurityNumber, 'Social Security Number')"
                                    />
                                </span>
                            </div>
                        </div>
                    </div>
                </q-card-section>

                <q-separator />

                <q-card-section class="employee-details-section">
                    <div class="row items-center q-mb-sm q-gutter-md">
                        <div class="col items-center row">
                            <div class="col-auto q-mr-sm">
                                <q-icon name="badge" size="20px" color="grey-7" />
                            </div>
                            <div v-if="employee.taxIdentificationNumber" class="col copyable-field-container">
                                <span>{{ employee.taxIdentificationNumber }}</span>
                                <q-icon
                                    name="content_copy"
                                    size="14px"
                                    class="copy-icon"
                                    @click.stop="copyToClipboard(employee.taxIdentificationNumber, 'TIN')"
                                />
                            </div>
                            <div v-else class="col">N/A</div>
                        </div>
                        <div class="col items-center row">
                            <div class="col-auto q-mr-sm">
                                <q-icon name="phone" size="20px" color="grey-7" />
                            </div>
                            <div v-if="employee.phone" class="col copyable-field-container">
                                <span>{{ employee.phone }}</span>
                                <q-icon
                                    name="content_copy"
                                    size="14px"
                                    class="copy-icon"
                                    @click.stop="copyToClipboard(employee.phone, 'Phone')"
                                />
                            </div>
                            <div v-else class="col">N/A</div>
                        </div>
                    </div>
                    <div class="row items-center">
                        <div class="col-auto q-mr-sm">
                            <q-icon name="email" size="20px" color="grey-7" />
                        </div>
                        <div v-if="employee.email" class="col copyable-field-container">
                            <span>{{ employee.email }}</span>
                            <q-icon
                                name="content_copy"
                                size="14px"
                                class="copy-icon"
                                @click.stop="copyToClipboard(employee.email, 'Email')"
                            />
                        </div>
                        <div v-else class="col">N/A</div>
                    </div>
                </q-card-section>
            </q-card>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useEmployeeStore } from '../../../stores/employee-store';
import { onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import GenderIcon from './GenderIcon.vue';

const employeeStore = useEmployeeStore();
const $q = useQuasar();

onMounted(async () => {
    try {
        await employeeStore.fetchEmployees();
    } catch (error) {
        console.error('Failed to fetch employees:', error);
    }
});

const employees = computed(() => employeeStore.employees);

const getInitial = (lastName: string | undefined | null): string => {
    if (!lastName) return '?';
    return lastName.charAt(0).toUpperCase();
};

const copyToClipboard = async (text: string, label: string) => {
    try {
        await navigator.clipboard.writeText(text);
        $q.notify({
            type: 'positive',
            message: `${label} copied to clipboard`,
            position: 'top',
            timeout: 2000,
        });
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        $q.notify({
            type: 'negative',
            message: 'Failed to copy to clipboard',
            position: 'top',
            timeout: 2000,
        });
    }
};
</script>

<style scoped>
.employee-card {
    position: relative;
    transition: box-shadow 0.3s ease;
}

.employee-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.employee-card-header {
    position: absolute;
    top: 12px;
    right: 32px;
    z-index: 1;
}

.employee-info-section {
    padding-top: 16px;
    padding-bottom: 16px;
}

.employee-details-section {
    padding-top: 16px;
    padding-bottom: 16px;
}

.copyable-field-container {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    position: relative;
}

.copy-icon {
    opacity: 0;
    transition: opacity 0.2s ease;
    cursor: pointer;
    color: var(--q-primary);
}

.copyable-field-container:hover .copy-icon {
    opacity: 1;
}

.copy-icon:hover {
    opacity: 1;
    transform: scale(1.1);
}
</style>
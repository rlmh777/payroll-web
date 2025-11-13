<template>
    <personal-info :employee="employee" />
</template>

<script setup lang="ts">
import PersonalInfo from '../common/PersonalInfo.vue';
import type { Employee } from '../../models';

defineProps<{
    employee: Employee;
}>();

</script>

<style scoped>

</style>
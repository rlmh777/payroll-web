<template>
  <div>
    <q-tabs v-model="tab" dense class="text-primary q-mb-md" align="left" narrow-indicator>
      <q-tab name="education" icon="school" label="Education" />
      <q-tab name="certifications" icon="verified" label="Certifications" />
      <q-tab name="skills" icon="psychology" label="Skills" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="education" class="q-pa-none">
        <manage-employee-qualifications :employee-id="employeeId" />
      </q-tab-panel>
      <q-tab-panel name="certifications" class="q-pa-none">
        <manage-employee-certifications :employee-id="employeeId" />
      </q-tab-panel>
      <q-tab-panel name="skills" class="q-pa-none">
        <manage-employee-skills :employee-id="employeeId" />
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ManageEmployeeQualifications from './ManageEmployeeQualifications.vue';
import ManageEmployeeCertifications from './ManageEmployeeCertifications.vue';
import ManageEmployeeSkills from './ManageEmployeeSkills.vue';

defineProps<{ employeeId: string }>();

const tab = ref('education');
</script>

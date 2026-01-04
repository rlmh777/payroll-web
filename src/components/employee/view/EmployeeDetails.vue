<template>
  <q-card class="q-gutter-y-md q-mt-sm">
    <q-tabs v-model="tab" dense no-caps inline-label class="bg-primary text-white shadow-4" align="left">
      <!-- leaves, loans, allowances, 
        deductions, contacts, qualifications,
        employment history, employment details -->
      <q-tab name="attendance" icon="movie" label="Attendance" />
      <q-tab name="leaves" icon="alarm" label="Leaves" />
      <q-tab name="allowances" icon="movie" label="Default Allowances" />
      <q-tab name="deductions" icon="movie" label="Default Deductions" />
      <!-- <q-tab name="qualifications" icon="mail" label="Qualifications" /> -->
      <q-tab name="contracts" icon="movie" label="Contracts" />
    </q-tabs>

    <q-separator class="q-my-sm" />
    
    <q-tab-panels v-model="tab" animated class="q-mt-none">
      <q-tab-panel name="attendance">
        <div class="text-h6">Movies</div>
      </q-tab-panel>

      <q-tab-panel name="leaves">
        <employee-leave-list />
      </q-tab-panel>

      <q-tab-panel name="allowances">
        <manage-employee-default-allowances />
      </q-tab-panel>

      <q-tab-panel name="deductions">
        <manage-employee-default-deductions />
      </q-tab-panel>

      <q-tab-panel name="contracts">
        <div class="text-h6">Movies</div>
        Lorem ipsum dolor sit amet consectetur adipisicing elit.
      </q-tab-panel>
    </q-tab-panels>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EmployeeLeaveList from '../leave/EmployeeLeaveList.vue';
import ManageEmployeeDefaultAllowances from '../default-allowance/ManageEmployeeDefaultAllowances.vue';
import ManageEmployeeDefaultDeductions from '../default-deduction/ManageEmployeeDefaultDeductions.vue';

const tab = ref('mails');
</script>
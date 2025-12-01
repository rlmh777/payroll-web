<template>
    <div>
      <q-stepper
        v-model="step"
        ref="stepper"
        color="primary"
        header-nav
        animated
      >
        <q-step
          :name="1"
          title="Personal Info"
          icon="person"
          :done="step > 1"
        >
          <personal-info />
        </q-step>
  
        <q-step
          :name="2"
          title="Address & Contact Info"
          icon="info"
          :done="step > 2"
        >
          <other-info />
        </q-step>
        <!-- <template v-slot:navigation>
          <q-stepper-navigation>
            <q-btn @click="next()" color="primary" :label="step === 3 ? 'Finish' : 'Continue'" />
            <q-btn v-if="step > 1" flat color="primary" @click="previous()" label="Back" class="q-ml-sm" />
          </q-stepper-navigation>
        </template> -->
      </q-stepper>
      <employee-details />
    </div>
  </template>

<script setup lang="ts">
import { ref } from 'vue'
import PersonalInfo from '../common/PersonalInfo.vue';
import OtherInfo from '../common/OtherInfo.vue';
import EmployeeDetails from './EmployeeDetails.vue';

const step = ref(1);

// const next = () => {
//   step.value++;
// };

// const previous = () => {
//   step.value--;
// };
</script>
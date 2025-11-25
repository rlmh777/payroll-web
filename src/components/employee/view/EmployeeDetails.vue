<template>
    <q-card class="q-gutter-y-md q-mt-sm">
    <q-tabs
        v-model="tab"
        dense
        no-caps
        inline-label
        class="bg-primary text-white shadow-4"
        align="left"
    >
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

    <q-separator />

    <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="attendance">
        <div class="text-h6">Movies</div>
        Lorem ipsum dolor sit amet consectetur adipisicing elit.
        </q-tab-panel>
        
        <q-tab-panel name="allowances">
        <div class="text-h6">Movies</div>
        Lorem ipsum dolor sit amet consectetur adipisicing elit.
        </q-tab-panel>  

    <q-tab-panel name="deductions">
    <div class="text-h6">Movies</div>
    Lorem ipsum dolor sit amet consectetur adipisicing elit.
    </q-tab-panel>

        <q-tab-panel name="leaves">
        <div class="text-h6">Alarms</div>
        Lorem ipsum dolor sit amet consectetur adipisicing elit.
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
  
  const tab = ref('mails');
  </script>
  
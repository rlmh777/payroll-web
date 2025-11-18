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
        <q-tab name="mails" icon="mail" label="Mails" />
        <q-tab name="alarms" icon="alarm" label="Alarms" />
        <q-tab name="movies" icon="movie" label="Movies" />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="mails">
        <div class="text-h6">Mails</div>
        Lorem ipsum dolor sit amet consectetur adipisicing elit.
        </q-tab-panel>

        <q-tab-panel name="alarms">
        <div class="text-h6">Alarms</div>
        Lorem ipsum dolor sit amet consectetur adipisicing elit.
        </q-tab-panel>

        <q-tab-panel name="movies">
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
  
<template>
  <q-page class="q-pa-md">
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6">Forms</div>
        <div class="text-caption text-grey-7">Forms assigned to you that still need a response.</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-list v-if="store.pending.length" bordered separator class="rounded-borders">
          <q-item v-for="row in store.pending" :key="row.id" clickable :to="`/forms/${row.id}`">
            <q-item-section>
              <q-item-label>{{ row.name || row.form_template?.name }}</q-item-label>
              <q-item-label caption>
                {{ row.is_required ? 'Required' : 'Optional' }}
                <span v-if="row.has_draft"> · Draft saved</span>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else class="text-grey-7 q-pa-md">You have no outstanding forms.</div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useFormAssignmentStore } from '@hr/stores/form-assignment-store';

const store = useFormAssignmentStore();

onMounted(() => {
  void store.fetchPending({ force: true });
});
</script>

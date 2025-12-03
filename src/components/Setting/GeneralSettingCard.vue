<template>
  <div class="row q-col-gutter-md q-pa-md q-pl-xl">
    <div v-if="!submenuItems.length" class="text-grey">No submenu items available.</div>

    <q-card
      v-for="(item, index) in submenuItems"
      :key="index"
      class="cursor-pointer q-pa-lg col-12 col-sm-6 col-md-2 q-mx-sm q-my-md hoverable"
      @click="goTo(item.route)"
    >
      <q-card-section class="text-center">
        <q-icon :name="item.icon || 'menu'" size="40px" color="primary" />
        <div class="text-subtitle1 q-mt-sm">{{ item.title }}</div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { MenuItem } from 'src/stores/menus'; // Ensure this path is correct

const router = useRouter();
const submenuItems = ref<MenuItem[]>([]);

onMounted(() => {
  const historyState = window.history.state as { submenu?: string };

  if (historyState && historyState.submenu) {
    try {
      // Parse the JSON string back into the MenuItem array
      submenuItems.value = JSON.parse(historyState.submenu) as MenuItem[];
    } catch (e) {
      console.error('Failed to parse submenu data from history state:', e);
      submenuItems.value = [];
    }
  }
});

function goTo(path?: string | null) {
  // 2. **Fix: Handle potential 'null' path**
  // The path can be `undefined` (which is handled by `?`) or `null`
  // if `item.route` is defined as `string | null | undefined`.
  if (path)
    router.push(path).catch((err) => {
      console.error('Navigation error:', err);
    });
}
</script>

<style scoped></style>

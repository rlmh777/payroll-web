<template>
  <q-layout view="hHh Lpr lFf">
    <!-- Top main menu -->
    <MainHeader />
    <!-- Side drawer -->
    <SideDrawer v-if="!shouldHideDrawer" />
    <q-page-container class="q-ma-md">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import MainHeader from 'src/components/navigation/common/MainHeader.vue';
import SideDrawer from 'src/components/navigation/common/SideDrawer.vue';

interface Props {
  hideDrawer?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  hideDrawer: false,
});

const route = useRoute();

const shouldHideDrawer = computed(() => {
  // Check if hideDrawer is passed as prop
  if (props.hideDrawer) {
    return true;
  }
  // Check if hideDrawer is in route meta
  return route.meta.hideDrawer === true;
});
</script>

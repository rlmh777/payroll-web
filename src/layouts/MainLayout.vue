<template>
  <q-layout view="hHh Lpr lFf" class="main-layout" :class="{ 'main-layout--full-height': isFullHeightPage }">
    <MainHeader :show-drawer-toggle="!shouldHideDrawer" />
    <SideDrawer v-if="!shouldHideDrawer" />
    <q-page-container
      class="main-page-container"
      :class="{ 'main-page-container--full-height': isFullHeightPage }"
    >
      <AppBreadcrumbs v-if="!isFullHeightPage" />
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import AppBreadcrumbs from 'src/components/navigation/common/AppBreadcrumbs.vue';
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
  if (props.hideDrawer) {
    return true;
  }

  return route.meta.hideDrawer === true;
});

const isFullHeightPage = computed(() => route.meta.fullHeight === true);
</script>

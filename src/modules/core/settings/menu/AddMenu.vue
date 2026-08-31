<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="add-menu-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add New Menu</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="form.title"
            label="Title *"
            outlined
            :rules="[val => !!val || 'Title is required']"
            :disable="menuStore.isLoading"
          />

          <q-select
            v-model="form.parent_id"
            :options="parentMenuOptions"
            option-value="id"
            option-label="title"
            emit-value
            map-options
            outlined
            label="Parent Menu"
            clearable
            :disable="menuStore.isLoading"
            hint="Leave empty for root menu"
          />

          <ModuleSelect v-model="form.module_code" :disable="menuStore.isLoading" />

          <q-input
            v-model="form.route"
            label="Route"
            outlined
            :disable="menuStore.isLoading"
            hint="e.g., /dashboard, /settings"
          />

          <q-input
            v-model="form.icon"
            label="Icon"
            outlined
            :disable="menuStore.isLoading"
            hint="e.g., fas fa-home, dashboard"
          />

          <PermissionSelect
            v-model="form.permission"
            label="Permission"
            :disable="menuStore.isLoading"
            :show-add-new="true"
            clearable
          />

          <q-input
            v-model.number="form.order"
            label="Order"
            type="number"
            min="0"
            outlined
            :disable="menuStore.isLoading"
            hint="Display order (lower numbers appear first)"
          />

          <q-select
            v-model="form.type"
            :options="typeOptions"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            outlined
            label="Type"
            :disable="menuStore.isLoading"
          />

          <q-checkbox
            v-model="form.is_active"
            label="Is Active"
            :disable="menuStore.isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="menuStore.isLoading"
            />
            <q-btn
              type="submit"
              label="Save"
              color="primary"
              :loading="menuStore.isLoading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useMenuStore, DEFAULT_MENU_MODULE } from '../../stores/menu-store';
import type { Menu } from '../../stores/menu-store';
import PermissionSelect from './PermissionSelect.vue';
import ModuleSelect from './ModuleSelect.vue';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'saved': [menuId: string];
}>();

const menuStore = useMenuStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const typeOptions = [
  { value: 'menu', label: 'Menu' },
  { value: 'submenu', label: 'Submenu' },
];

const parentMenuOptions = computed((): Menu[] => {
  // Only show root menus as potential parents
  return menuStore.rootMenus;
});

const form = ref({
  title: '',
  parent_id: null as string | null,
  route: '',
  icon: '',
  permission: '',
  order: 0,
  type: 'menu' as string,
  is_active: true,
  module_code: DEFAULT_MENU_MODULE,
});

const onSubmit = async () => {
  if (!form.value.title) {
    return;
  }

  try {
    const newMenu = await menuStore.createMenu(
      form.value.title,
      form.value.parent_id || null,
      form.value.route || null,
      form.value.icon || null,
      form.value.permission || null,
      form.value.order,
      form.value.is_active,
      form.value.type,
      form.value.module_code,
    );

    if (newMenu) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Menu created successfully!',
      });
      emit('saved', newMenu.id);
      onClose();
    } else if (menuStore.error) {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'error',
        message: menuStore.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create menu';
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: errorMessage,
    });
  }
};

const onClose = () => {
  form.value = {
    title: '',
    parent_id: null,
    route: '',
    icon: '',
    permission: '',
    order: 0,
    type: 'menu',
    is_active: true,
    module_code: DEFAULT_MENU_MODULE,
  };
  isOpen.value = false;
};

watch(
  () => form.value.parent_id,
  (parentId) => {
    if (!parentId) {
      return;
    }

    const parent = menuStore.menus.find((menu) => menu.id === parentId);
    if (parent?.module_code) {
      form.value.module_code = parent.module_code;
    }
  },
);

// Reset form when dialog opens
watch(isOpen, async (newValue) => {
  if (newValue) {
    form.value = {
      title: '',
      parent_id: null,
      route: '',
      icon: '',
      permission: '',
      order: 0,
      type: 'menu',
      is_active: true,
      module_code: DEFAULT_MENU_MODULE,
    };
    // Fetch menus to populate parent options
    await menuStore.fetchMenus();
  }
});
</script>

<style scoped>
.add-menu-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.add-menu-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>


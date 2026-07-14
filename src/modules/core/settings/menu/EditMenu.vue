<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="edit-menu-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Menu</div>
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
              label="Update"
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
import { useMenuStore } from '../../stores/menu-store';
import type { Menu } from '../../stores/menu-store';
import PermissionSelect from './PermissionSelect.vue';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
  menu: Menu | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  menu: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updated': [menuId: string];
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
  // Only show root menus as potential parents, excluding the current menu
  return menuStore.rootMenus.filter(m => m.id !== props.menu?.id);
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
});

const onSubmit = async () => {
  if (!form.value.title || !props.menu) {
    return;
  }

  try {
    const updatedMenu = await menuStore.updateMenu(
      props.menu.id,
      form.value.title,
      form.value.parent_id || null,
      form.value.route || null,
      form.value.icon || null,
      form.value.permission || null,
      form.value.order,
      form.value.is_active,
      form.value.type
    );

    if (updatedMenu) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Menu updated successfully!',
      });
      emit('updated', updatedMenu.id);
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to update menu';
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: errorMessage,
    });
  }
};

const onClose = () => {
  isOpen.value = false;
};

// Load menu data when dialog opens
watch(isOpen, async (newValue) => {
  if (newValue && props.menu) {
    // Fetch menus to populate parent options
    await menuStore.fetchMenus();
    // Populate form with existing data
    form.value = {
      title: props.menu.title || '',
      parent_id: props.menu.parent_id || null,
      route: props.menu.route || '',
      icon: props.menu.icon || '',
      permission: props.menu.permission || '',
      order: props.menu.order || 0,
      type: props.menu.type || 'menu',
      is_active: props.menu.is_active !== undefined ? props.menu.is_active : true,
    };
  }
});
</script>

<style scoped>
.edit-menu-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.edit-menu-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>


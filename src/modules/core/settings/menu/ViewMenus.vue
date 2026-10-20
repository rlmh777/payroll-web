<template>
  <div class="menus-table-container">
    <q-table
      class="menus-table"
      flat
      bordered
      dense
      :rows="groupedMenus"
      :columns="columns"
      :loading="isLoading"
      row-key="id"
      v-model:pagination="pagination"
      :rows-per-page-options="[10, 15, 20, 50]"
      @request="onRequest"
    >
      <template #body="props">
        <q-tr
          :props="props"
          :class="{ 'menu-row--over': dragOverId === props.row.id && canDropOn(props.row) }"
          @dragover.prevent="onDragOver(props.row)"
          @dragleave="onDragLeave(props.row)"
          @drop.prevent="onDrop(props.row)"
        >
          <q-td v-for="col in props.cols" :key="col.name" :props="props">
            <span
              v-if="col.name === 'drag'"
              class="menu-drag-handle"
              draggable="true"
              @dragstart.stop="onDragStart($event, props.row)"
              @dragend="onDragEnd"
            >
              <q-icon name="drag_indicator" />
            </span>
            <template v-else-if="col.name === 'parent'">
              {{ getParentTitle(props.row) }}
            </template>
            <template v-else-if="col.name === 'icon'">
              <q-icon v-if="col.value" :name="col.value" size="sm" />
              <span v-else class="text-grey">-</span>
            </template>
            <template v-else-if="col.name === 'module_code'">
              {{ getModuleTitle(props.row.module_code) }}
            </template>
            <template v-else-if="col.name === 'is_active'">
              <q-icon
                :name="col.value ? 'check_circle' : 'cancel'"
                :color="col.value ? 'positive' : 'negative'"
                size="sm"
              />
            </template>
            <div v-else-if="col.name === 'actions'" class="action-buttons">
              <q-btn
                flat
                round
                dense
                icon="edit"
                color="primary"
                size="sm"
                class="action-btn"
                @click="openEditDialog(props.row)"
              >
                <q-tooltip>Edit Menu</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                icon="delete"
                color="negative"
                size="sm"
                class="action-btn"
                @click="confirmDelete(props.row)"
              >
                <q-tooltip>Delete Menu</q-tooltip>
              </q-btn>
            </div>
            <template v-else>
              {{ col.value }}
            </template>
          </q-td>
        </q-tr>
      </template>
    </q-table>
    <EditMenu
      v-model="showEditDialog"
      :menu="selectedMenu"
      @updated="onMenuUpdated"
    />
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6">Confirm Delete</span>
        </q-card-section>

        <q-card-section>
          <span>Are you sure you want to delete "{{ menuToDelete?.title }}"? This action cannot be undone.</span>
          <div v-if="menuToDelete?.children && menuToDelete.children.length > 0" class="q-mt-md text-negative">
            <strong>Warning:</strong> This menu has {{ menuToDelete.children.length }} child menu(s). Delete children first.
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="handleDelete" :loading="menuStore.isLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useMenuStore } from '../../stores/menu-store';
import { useMenuStore as useNavigationMenuStore } from '../../stores/menus';
import { useModuleStore } from '../../stores/module-store';
import EditMenu from './EditMenu.vue';
import type { Menu } from '../../stores/menu-store';

const $q = useQuasar();
const menuStore = useMenuStore();
const navigationMenuStore = useNavigationMenuStore();
const moduleStore = useModuleStore();

const columns = [
  {
    name: 'drag',
    label: '',
    field: 'id',
    align: 'center' as const,
    sortable: false,
  },
  {
    name: 'order',
    label: 'Order',
    field: 'order',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'icon',
    label: 'Icon',
    field: 'icon',
    align: 'center' as const,
    sortable: false,
  },
  {
    name: 'title',
    label: 'Title',
    field: 'title',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'parent',
    label: 'Parent',
    field: 'parent',
    align: 'left' as const,
    sortable: false,
  },
  {
    name: 'route',
    label: 'Route',
    field: 'route',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'permission',
    label: 'Permission',
    field: 'permission',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'module_code',
    label: 'Module',
    field: 'module_code',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'type',
    label: 'Type',
    field: 'type',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'is_active',
    label: 'Active',
    field: 'is_active',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'actions',
    label: '',
    field: '',
    align: 'right' as const,
    sortable: false,
  },
];

const allMenus = computed(() => {
  const rootMenus = [...menuStore.rootMenus].sort(compareMenus);
  const result: Menu[] = [];

  rootMenus.forEach(rootMenu => {
    result.push(rootMenu);
    if (rootMenu.children && rootMenu.children.length > 0) {
      result.push(...[...rootMenu.children].sort(compareMenus));
    }
  });
  
  // Add any menus that might not have been loaded with children
  const allMenuIds = new Set(result.map(m => m.id));
  menuStore.menus.forEach(menu => {
    if (!allMenuIds.has(menu.id)) {
      result.push(menu);
    }
  });
  
  // Filter by search term if provided
  const searchTerm = menuStore.searchFilters.search;
  if (searchTerm) {
    const lowerSearch = searchTerm.toLowerCase();
    return result.filter(menu => 
      menu.title.toLowerCase().includes(lowerSearch) ||
      (menu.route && menu.route.toLowerCase().includes(lowerSearch)) ||
      (menu.permission && menu.permission.toLowerCase().includes(lowerSearch)) ||
      (menu.module_code && menu.module_code.toLowerCase().includes(lowerSearch))
    );
  }
  
  return result;
});

const groupedMenus = computed(() => {
  // Apply pagination
  const start = (pagination.value.page - 1) * pagination.value.rowsPerPage;
  const end = start + pagination.value.rowsPerPage;
  return allMenus.value.slice(start, end);
});

const isLoading = computed(() => menuStore.isLoadingMenus);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedMenu = ref<Menu | null>(null);
const menuToDelete = ref<Menu | null>(null);
const draggingMenu = ref<Menu | null>(null);
const dragOverId = ref<string | null>(null);

function compareMenus(left: Menu, right: Menu): number {
  return (left.order ?? 0) - (right.order ?? 0) || left.title.localeCompare(right.title);
}

function sameParent(left: Menu, right: Menu): boolean {
  return (left.parent_id ?? null) === (right.parent_id ?? null);
}

function canDropOn(target: Menu): boolean {
  return Boolean(draggingMenu.value && draggingMenu.value.id !== target.id && sameParent(draggingMenu.value, target));
}

function onDragStart(event: DragEvent, menu: Menu) {
  draggingMenu.value = menu;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', menu.id);
  }
}

function onDragOver(menu: Menu) {
  dragOverId.value = canDropOn(menu) ? menu.id : null;
}

function onDragLeave(menu: Menu) {
  if (dragOverId.value === menu.id) {
    dragOverId.value = null;
  }
}

function onDragEnd() {
  draggingMenu.value = null;
  dragOverId.value = null;
}

async function onDrop(target: Menu) {
  const source = draggingMenu.value;
  dragOverId.value = null;
  draggingMenu.value = null;
  if (!source || source.id === target.id || !sameParent(source, target)) {
    return;
  }

  const siblings = menuStore.menus
    .filter((menu) => (menu.parent_id ?? null) === (target.parent_id ?? null))
    .sort(compareMenus);
  const fromIndex = siblings.findIndex((menu) => menu.id === source.id);
  const toIndex = siblings.findIndex((menu) => menu.id === target.id);
  if (fromIndex < 0 || toIndex < 0) {
    return;
  }

  const next = siblings.slice();
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) {
    return;
  }
  next.splice(toIndex, 0, moved);
  const items = next.map((menu, index) => ({ id: menu.id, order: index + 1 }));
  const saved = await menuStore.reorderMenus(items);
  if (!saved) {
    $q.notify({
      type: 'negative',
      message: menuStore.error || 'Failed to reorder menus',
      position: 'top',
    });
    return;
  }

  navigationMenuStore.applyMenuOrder(items);
}

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
  sortBy: 'order',
  descending: false,
});

// Initialize rowsNumber with total menus count
watch(() => allMenus.value.length, (newLength: number) => {
  pagination.value.rowsNumber = newLength;
}, { immediate: true });

const onRequest = (props: {
  pagination: { page: number; rowsPerPage: number; sortBy?: string; descending?: boolean };
}) => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.rowsNumber = allMenus.value.length;
};

const getModuleTitle = (moduleCode?: string | null): string => {
  if (!moduleCode) {
    return '—';
  }

  const module = moduleStore.modules.find((item) => item.code === moduleCode);
  return module?.title ?? moduleCode;
};

const getParentTitle = (menu: Menu): string => {
  // First check if parent is loaded and has a title
  if (menu.parent && menu.parent.title) {
    return menu.parent.title;
  }
  
  // If parent_id exists but parent object is not loaded, look it up
  if (menu.parent_id) {
    const parentMenu = menuStore.menus.find(m => m.id === menu.parent_id);
    if (parentMenu) {
      return parentMenu.title;
    }
  }
  
  // No parent found
  return 'Root';
};

const openEditDialog = (menu: Menu) => {
  selectedMenu.value = menu;
  showEditDialog.value = true;
};

const onMenuUpdated = (menuId: string) => {
  const updated = menuStore.menus.find((menu) => menu.id === menuId);
  if (updated) {
    navigationMenuStore.applyMenuUpdate(updated);
  }
  showEditDialog.value = false;
  selectedMenu.value = null;
};

const confirmDelete = (menu: Menu) => {
  menuToDelete.value = menu;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!menuToDelete.value) return;

  const success = await menuStore.deleteMenu(menuToDelete.value.id);
  if (success) {
    $q.notify({
      type: 'positive',
      message: 'Menu deleted successfully',
      position: 'top',
    });
    showDeleteDialog.value = false;
    navigationMenuStore.removeNavigationMenu(menuToDelete.value.id);
    menuToDelete.value = null;
  } else {
    $q.notify({
      type: 'negative',
      message: menuStore.error || 'Failed to delete menu',
      position: 'top',
    });
  }
};

onMounted(async () => {
  await moduleStore.fetchModules();
  await menuStore.fetchMenus();
  pagination.value.rowsNumber = allMenus.value.length;
});
</script>

<style scoped>
.menus-table-container {
  height: calc(100vh - 250px);
  display: flex;
  flex-direction: column;
}

.menus-table {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.menus-table :deep(.q-table__container) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.menus-table :deep(.q-table__middle) {
  flex: 1;
  overflow: auto;
}

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.menu-drag-handle {
  cursor: grab;
  color: #64748b;
}

.menu-row--over {
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}

.action-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
}

:deep(.q-table tbody tr:hover .action-btn) {
  opacity: 1;
}
</style>


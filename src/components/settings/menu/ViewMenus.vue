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
      <template v-slot:body-cell-parent="props">
        <q-td :props="props">
          {{ getParentTitle(props.row) }}
        </q-td>
      </template>
      <template v-slot:body-cell-icon="props">
        <q-td :props="props">
          <q-icon v-if="props.value" :name="props.value" size="sm" />
          <span v-else class="text-grey">-</span>
        </q-td>
      </template>
      <template v-slot:body-cell-is_active="props">
        <q-td :props="props">
          <q-icon
            :name="props.value ? 'check_circle' : 'cancel'"
            :color="props.value ? 'positive' : 'negative'"
            size="sm"
          />
        </q-td>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <div class="action-buttons">
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
        </q-td>
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
import { useMenuStore } from '../../../stores/menu-store';
import { useMenuStore as useNavigationMenuStore } from '../../../stores/menus';
import EditMenu from './EditMenu.vue';
import type { Menu } from '../../../stores/menu-store';

const $q = useQuasar();
const menuStore = useMenuStore();
const navigationMenuStore = useNavigationMenuStore();

const columns = [
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
  // Group menus by parent, showing parent menus first, then their children
  const rootMenus = menuStore.rootMenus;
  const result: Menu[] = [];
  
  rootMenus.forEach(rootMenu => {
    result.push(rootMenu);
    // Add children if they exist
    if (rootMenu.children && rootMenu.children.length > 0) {
      result.push(...rootMenu.children);
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
      (menu.permission && menu.permission.toLowerCase().includes(lowerSearch))
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

const pagination = ref({
  page: 1,
  rowsPerPage: 15,
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

const onMenuUpdated = async () => {
  // Refresh the list after a menu is updated
  await menuStore.fetchMenus();
  // Refresh the navigation menu (header and drawer)
  await navigationMenuStore.fetchMenus();
  // Reset pagination to first page to show updated data
  pagination.value.page = 1;
  // Close edit dialog
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
    menuToDelete.value = null;
    // Refresh the list after deletion
    await menuStore.fetchMenus();
    // Refresh the navigation menu (header and drawer)
    await navigationMenuStore.fetchMenus();
  } else {
    $q.notify({
      type: 'negative',
      message: menuStore.error || 'Failed to delete menu',
      position: 'top',
    });
  }
};

onMounted(async () => {
  // Fetch menus on mount
  await menuStore.fetchMenus();
  // Set initial pagination rowsNumber
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

.action-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
}

:deep(.q-table tbody tr:hover .action-btn) {
  opacity: 1;
}
</style>


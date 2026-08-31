<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <q-card-section class="row items-center q-gutter-sm">
        <q-input
          v-model="search"
          dense
          outlined
          clearable
          label="Search groups"
          class="col-grow"
          @keyup.enter="refresh"
        />
        <q-btn color="primary" icon="add" label="Add group" @click="openCreate" />
      </q-card-section>

      <q-card-section class="q-pt-none q-pb-none">
        <q-table
          flat
          bordered
          dense
          row-key="id"
          title="Employee groups"
          :rows="groups"
          :columns="columns"
          :loading="store.isLoading"
          no-data-label="No employee groups"
        >
          <template #body-cell-color="props">
            <q-td :props="props">
              <q-badge v-if="props.row.color" :style="{ backgroundColor: props.row.color }" :label="props.row.color" />
              <span v-else class="text-grey-6">—</span>
            </q-td>
          </template>

          <template #body-cell-isActive="props">
            <q-td :props="props">
              <q-icon
                :name="props.row.isActive ? 'check_circle' : 'cancel'"
                :color="props.row.isActive ? 'positive' : 'grey'"
              />
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn flat round dense icon="groups" color="primary" size="sm" @click="openMembers(props.row)">
                <q-tooltip>Manage members</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="edit" color="primary" size="sm" @click="openEdit(props.row)" />
              <q-btn flat round dense icon="delete" color="negative" size="sm" @click="confirmDelete(props.row)" />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <EmployeeGroupFormDialog v-model="showFormDialog" :group="editingGroup" @saved="refresh" />
    <EmployeeGroupMembersDialog
      v-model="showMembersDialog"
      :group="membersGroup"
      @saved="refresh"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import EmployeeGroupFormDialog from '@hr/components/employee-group/EmployeeGroupFormDialog.vue';
import EmployeeGroupMembersDialog from '@hr/components/employee-group/EmployeeGroupMembersDialog.vue';
import { useEmployeeGroupStore, type EmployeeGroup } from '@hr/stores/employee-group-store';

const $q = useQuasar();
const store = useEmployeeGroupStore();

const search = ref('');
const showFormDialog = ref(false);
const showMembersDialog = ref(false);
const editingGroup = ref<EmployeeGroup | null>(null);
const membersGroup = ref<EmployeeGroup | null>(null);

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'description', label: 'Description', field: 'description', align: 'left' },
  { name: 'activeMemberCount', label: 'Members', field: 'activeMemberCount', align: 'right' },
  { name: 'color', label: 'Color', field: 'color', align: 'left' },
  { name: 'isActive', label: 'Active', field: 'isActive', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
];

const groups = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) {
    return store.groups;
  }

  return store.groups.filter((group) => {
    const haystack = `${group.name} ${group.description ?? ''}`.toLowerCase();
    return haystack.includes(query);
  });
});

async function refresh() {
  await store.fetchGroups({ withMembers: true, activeOnly: false });
}

function openCreate() {
  editingGroup.value = null;
  showFormDialog.value = true;
}

function openEdit(group: EmployeeGroup) {
  editingGroup.value = group;
  showFormDialog.value = true;
}

function openMembers(group: EmployeeGroup) {
  membersGroup.value = group;
  showMembersDialog.value = true;
}

function confirmDelete(group: EmployeeGroup) {
  $q.dialog({
    title: 'Delete group',
    message: `Delete "${group.name}"? Members will be removed from this group.`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteGroup(group.id);
        $q.notify({ type: 'positive', message: 'Employee group deleted.' });
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: error instanceof Error ? error.message : 'Failed to delete employee group.',
        });
      }
    })();
  });
}

onMounted(async () => {
  await refresh();
});
</script>

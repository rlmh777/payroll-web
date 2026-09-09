<template>
  <div>
    <q-select
      :model-value="modelValue"
      :options="filteredOptions"
      :label="label"
      outlined
      dense
      clearable
      emit-value
      map-options
      use-input
      fill-input
      hide-selected
      input-debounce="0"
      :loading="groupStore.isLoading"
      :disable="disable"
      @filter="filterOptions"
      @update:model-value="onSelect"
    >
      <template #option="scope">
        <q-item
          v-if="scope.opt.value === ADD_GROUP_VALUE"
          clickable
          v-close-popup
          @click="openCreate"
        >
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ scope.opt.label }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label class="row items-center no-wrap">
              <q-badge
                v-if="scope.opt.color"
                rounded
                class="q-mr-sm"
                :style="{ backgroundColor: scope.opt.color }"
              />
              <span>{{ scope.opt.label }}</span>
            </q-item-label>
          </q-item-section>
          <q-item-section v-if="showEdit && !disable" side>
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              size="sm"
              @click.stop="openEdit(scope.opt.value)"
            >
              <q-tooltip>Edit group</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
      <template #no-option>
        <q-item>
          <q-item-section class="text-grey">No matching groups</q-item-section>
        </q-item>
      </template>
    </q-select>

    <EmployeeGroupFormDialog
      v-model="showFormDialog"
      :group="editingGroup"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import EmployeeGroupFormDialog from '@hr/components/employee-group/EmployeeGroupFormDialog.vue';
import {
  useEmployeeGroupStore,
  type EmployeeGroup,
} from '@hr/stores/employee-group-store';

const ADD_GROUP_VALUE = '__add_group__';

type GroupOption = {
  label: string;
  value: string;
  color?: string | null;
};

const props = withDefaults(defineProps<{
  modelValue: string | null;
  label?: string;
  disable?: boolean;
  showAddNew?: boolean;
  showEdit?: boolean;
}>(), {
  label: 'Employee group',
  disable: false,
  showAddNew: true,
  showEdit: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
}>();

const groupStore = useEmployeeGroupStore();
const showFormDialog = ref(false);
const editingGroup = ref<EmployeeGroup | null>(null);
const selectAfterSave = ref(false);
const filterText = ref('');

const allOptions = computed<GroupOption[]>(() => {
  const list: GroupOption[] = groupStore.groupOptions.map((option) => {
    const group = groupStore.groups.find((item) => item.id === option.value);
    return {
      ...option,
      color: group?.color ?? null,
    };
  });

  if (props.showAddNew && !props.disable) {
    list.unshift({ label: '+ Add group', value: ADD_GROUP_VALUE });
  }

  return list;
});

const filteredOptions = computed<GroupOption[]>(() => {
  const needle = filterText.value.trim().toLowerCase();
  if (!needle) {
    return allOptions.value;
  }

  return allOptions.value.filter((option) => {
    if (option.value === ADD_GROUP_VALUE) {
      return true;
    }

    return option.label.toLowerCase().includes(needle);
  });
});

function filterOptions(value: string, update: (callback: () => void) => void) {
  update(() => {
    filterText.value = value || '';
  });
}

function onSelect(value: string | null) {
  if (value === ADD_GROUP_VALUE) {
    openCreate();
    return;
  }

  filterText.value = '';
  emit('update:modelValue', value);
}

function openCreate() {
  editingGroup.value = null;
  selectAfterSave.value = true;
  showFormDialog.value = true;
}

function openEdit(groupId: string) {
  editingGroup.value = groupStore.groups.find((group) => group.id === groupId) ?? null;
  if (!editingGroup.value) {
    return;
  }

  selectAfterSave.value = false;
  showFormDialog.value = true;
}

async function onSaved(group: EmployeeGroup) {
  await groupStore.fetchGroups({ withMembers: false, activeOnly: true });
  await nextTick();

  if (selectAfterSave.value && group?.id && group.isActive !== false) {
    emit('update:modelValue', group.id);
  } else if (props.modelValue === group.id && group.isActive === false) {
    emit('update:modelValue', null);
  }

  selectAfterSave.value = false;
  filterText.value = '';
}

onMounted(async () => {
  if (!groupStore.groups.length) {
    await groupStore.fetchGroups({ withMembers: false, activeOnly: true });
  }
});
</script>

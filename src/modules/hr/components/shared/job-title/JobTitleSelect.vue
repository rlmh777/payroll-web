<template>
  <div>
    <q-select
      v-model="selectedId"
      :options="options"
      option-value="id"
      option-label="name"
      emit-value
      map-options
      use-input
      fill-input
      hide-selected
      input-debounce="300"
      outlined
      dense
      clearable
      :label="label"
      :disable="disable"
      :loading="store.isLoadingJobTitles"
      :hint="selectedHint"
      @filter="filterOptions"
    >
      <template v-if="store.isLoadingJobTitles" #prepend>
        <q-spinner color="primary" size="20px" />
      </template>
      <template #option="scope">
        <q-item
          v-if="scope.opt.id === 'add-new'"
          clickable
          v-close-popup
          @click="openAddDialog"
        >
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add New Job Title</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name }}</q-item-label>
            <q-item-label v-if="scope.opt.payScale" caption>{{ scope.opt.payScale }}</q-item-label>
          </q-item-section>
          <q-item-section v-if="showEdit && !disable" side>
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              size="sm"
              @click.stop="openEditDialog(scope.opt as JobTitle)"
            >
              <q-tooltip>Edit Job Title</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <div v-if="selectedDescriptionUrl" class="q-mt-xs">
      <q-btn
        flat
        dense
        no-caps
        color="primary"
        icon="picture_as_pdf"
        label="View job description"
        type="a"
        :href="selectedDescriptionUrl"
        target="_blank"
        rel="noopener noreferrer"
      />
    </div>

    <AddJobTitle v-model="showAddDialog" @saved="onSaved" />
    <UpdateJobTitle
      v-model="showEditDialog"
      :job-title="selectedItem"
      @updated="onUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useJobTitleStore, type JobTitle } from '@core/stores/job-title-store';
import AddJobTitle from '@core/settings/job-title/AddJobTitle.vue';
import UpdateJobTitle from '@core/settings/job-title/UpdateJobTitle.vue';

const props = withDefaults(defineProps<{
  modelValue?: number | null;
  label?: string;
  disable?: boolean;
  showAddNew?: boolean;
  showEdit?: boolean;
}>(), {
  modelValue: null,
  label: 'Job title',
  disable: false,
  showAddNew: true,
  showEdit: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
}>();

const store = useJobTitleStore();
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const selectedItem = ref<JobTitle | null>(null);
const options = ref<(JobTitle | { id: number | string; name: string; payScale?: string | null })[]>([]);

const selectedId = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value ?? null),
});

const selectedJobTitle = computed(() =>
  store.jobTitles.find((item) => item.id === props.modelValue) ?? null,
);

const selectedHint = computed(() => {
  const payScale = selectedJobTitle.value?.payScale?.trim();
  return payScale ? `Pay scale: ${payScale}` : undefined;
});

const selectedDescriptionUrl = computed(() => selectedJobTitle.value?.jobDescriptionUrl ?? null);

function buildOptions(items: JobTitle[]) {
  const list: (JobTitle | { id: number | string; name: string; payScale?: string | null })[] = [...items];
  if (props.showAddNew && !props.disable) {
    list.unshift({ id: 'add-new', name: 'Add New Job Title' });
  }
  options.value = list;
}

async function filterOptions(value: string, update: (callback: () => void) => void) {
  if (!store.jobTitles.length) {
    await store.fetchJobTitles(1, 100);
  }

  update(() => {
    const needle = value.trim().toLowerCase();
    const filtered = !needle
      ? store.jobTitles
      : store.jobTitles.filter((item) =>
          item.name.toLowerCase().includes(needle)
          || (item.payScale ?? '').toLowerCase().includes(needle),
        );
    buildOptions(filtered);
  });
}

function openAddDialog() {
  showAddDialog.value = true;
}

function openEditDialog(item: JobTitle) {
  selectedItem.value = item;
  showEditDialog.value = true;
}

async function onSaved(jobTitleId: number) {
  await store.fetchJobTitles(1, 100);
  buildOptions(store.jobTitles);
  await nextTick();
  selectedId.value = jobTitleId;
}

async function onUpdated() {
  await store.fetchJobTitles(1, 100);
  buildOptions(store.jobTitles);
}

onMounted(async () => {
  if (!store.jobTitles.length) {
    await store.fetchJobTitles(1, 100);
  }
  buildOptions(store.jobTitles);
});
</script>

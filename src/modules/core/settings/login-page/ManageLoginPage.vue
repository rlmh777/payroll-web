<template>
  <q-page class="login-designer q-pa-md">
    <div class="login-designer__header">
      <div>
        <div class="text-h6" data-onboarding="admin-settings">Login Page</div>
        <div class="text-body2 text-grey-7">
          Drag headings, messages, images, and the sign-in form onto the canvas. Background images can
          sit as a still photo or a carousel.
        </div>
      </div>
      <div class="row q-gutter-sm items-center">
        <q-btn
          flat
          label="Reset layout"
          :disable="store.isLoading || store.isSaving || !canEdit"
          @click="resetLayout"
        />
        <q-btn
          color="primary"
          label="Save"
          :loading="store.isSaving"
          :disable="store.isLoading || !canEdit"
          @click="save"
        />
      </div>
    </div>

    <div class="login-designer__body">
      <aside class="login-designer__panel">
        <div class="text-subtitle2 q-mb-sm">Blocks</div>
        <div class="login-designer__palette">
          <button
            v-for="item in palette"
            :key="item.type"
            type="button"
            class="login-designer__chip"
            :draggable="canEdit"
            :disabled="!canEdit"
            @dragstart="onPaletteDragStart(item.type, $event)"
            @click="addBlock(item.type)"
          >
            <q-icon :name="item.icon" size="18px" />
            <span>{{ item.label }}</span>
          </button>
        </div>

        <div class="text-subtitle2 q-mt-md q-mb-sm">Background</div>
        <q-btn-toggle
          v-model="store.layout.backgroundMode"
          class="login-designer__toggle"
          unelevated
          no-caps
          spread
          :disable="!canEdit"
          :options="backgroundOptions"
        />
        <div class="row items-center no-wrap q-gutter-sm q-mt-sm">
          <input
            class="login-designer__swatch"
            type="color"
            v-model="store.layout.backgroundColor"
            :disabled="!canEdit"
          />
          <q-input
            class="col"
            :model-value="store.layout.backgroundColor"
            label="Fallback color"
            outlined
            dense
            :disable="!canEdit"
            @update:model-value="store.layout.backgroundColor = String($event || '#0f172a')"
          />
        </div>
        <q-input
          v-if="store.layout.backgroundMode === 'carousel'"
          :model-value="store.layout.carouselIntervalMs / 1000"
          class="q-mt-sm"
          label="Carousel seconds"
          outlined
          dense
          type="number"
          min="2"
          max="30"
          :disable="!canEdit"
          @update:model-value="onCarouselSeconds"
        />

        <div class="text-subtitle2 q-mt-md q-mb-sm">Images</div>
        <input
          ref="fileInputRef"
          class="hidden"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          @change="onFileChange"
        />
        <q-btn
          outline
          color="primary"
          icon="upload"
          label="Upload image"
          class="full-width"
          :loading="store.isUploading"
          :disable="!canEdit"
          @click="fileInputRef?.click()"
        />
        <div v-if="store.layout.images.length === 0" class="text-caption text-grey-7 q-mt-sm">
          Upload photos to use in the background carousel or as image blocks.
        </div>
        <div class="login-designer__images q-mt-sm">
          <div v-for="image in store.layout.images" :key="image.id" class="login-designer__image">
            <img :src="image.url || ''" alt="" />
            <div class="login-designer__image-actions">
              <q-checkbox
                dense
                :model-value="store.layout.backgroundImageIds.includes(image.id)"
                label="Background"
                :disable="!canEdit"
                @update:model-value="toggleBackground(image.id)"
              />
              <q-btn
                flat
                dense
                size="sm"
                icon="wallpaper"
                :disable="!canEdit || selectedBlock?.type !== 'image'"
                @click="assignImage(image.id)"
              >
                <q-tooltip>Use on selected image block</q-tooltip>
              </q-btn>
              <q-btn
                flat
                dense
                size="sm"
                color="negative"
                icon="delete"
                :disable="!canEdit"
                @click="removeImage(image.id)"
              />
            </div>
          </div>
        </div>
      </aside>

      <div class="login-designer__canvas">
        <q-inner-loading :showing="store.isLoading">
          <q-spinner color="primary" size="32px" />
        </q-inner-loading>
        <LoginPageStage
          :layout="store.layout"
          editable
          :selected-id="selectedId"
          @select="selectedId = $event"
          @move="onMove"
          @resize="onResize"
          @drop-block="addBlock"
        />
      </div>

      <aside class="login-designer__panel">
        <div class="text-subtitle2 q-mb-sm">Selected</div>
        <div v-if="!selectedBlock" class="text-caption text-grey-7">
          Click a block on the canvas, or drag one from the left.
        </div>
        <template v-else>
          <div class="text-caption text-grey-7 q-mb-sm">{{ selectedLabel }}</div>
          <q-input
            v-if="selectedBlock.type === 'heading' || selectedBlock.type === 'message'"
            :model-value="selectedBlock.text"
            type="textarea"
            autogrow
            outlined
            dense
            label="Text"
            :disable="!canEdit"
            @update:model-value="updateSelected({ text: String($event ?? '') })"
          />
          <q-input
            v-if="selectedBlock.type === 'heading' || selectedBlock.type === 'message'"
            class="q-mt-sm"
            :model-value="selectedBlock.fontSize"
            type="number"
            min="10"
            max="72"
            outlined
            dense
            label="Font size"
            :disable="!canEdit"
            @update:model-value="updateSelected({ fontSize: Number($event) })"
          />
          <div class="row items-center no-wrap q-gutter-sm q-mt-sm">
            <input
              class="login-designer__swatch"
              type="color"
              v-model="selectedBlock.color"
              :disabled="!canEdit"
            />
            <q-input
              class="col"
              :model-value="selectedBlock.color"
              outlined
              dense
              label="Color"
              :disable="!canEdit"
              @update:model-value="updateSelected({ color: String($event ?? '#ffffff') })"
            />
          </div>
          <q-btn-toggle
            v-if="selectedBlock.type === 'heading' || selectedBlock.type === 'message'"
            class="login-designer__toggle q-mt-sm"
            unelevated
            no-caps
            spread
            :model-value="selectedBlock.align"
            :disable="!canEdit"
            :options="alignOptions"
            @update:model-value="updateSelected({ align: $event })"
          />
          <q-select
            v-if="selectedBlock.type === 'image'"
            :model-value="selectedBlock.imageId"
            :options="imageOptions"
            emit-value
            map-options
            outlined
            dense
            label="Image"
            clearable
            :disable="!canEdit"
            @update:model-value="updateSelected({ imageId: $event || null })"
          />
          <div v-if="selectedBlock.type === 'form'" class="column q-gutter-sm">
            <div class="text-caption text-grey-7">
              Drag the form to place it, or set width here. Max width keeps the card from stretching on large screens.
            </div>
            <q-input
              :model-value="Math.round(selectedBlock.width)"
              type="number"
              min="8"
              max="100"
              outlined
              dense
              label="Width (%)"
              :disable="!canEdit"
              @update:model-value="updateSelected({ width: Number($event) })"
            />
            <q-input
              :model-value="Math.round(selectedBlock.height)"
              type="number"
              min="6"
              max="100"
              outlined
              dense
              label="Height (%)"
              :disable="!canEdit"
              @update:model-value="updateSelected({ height: Number($event) })"
            />
            <q-input
              :model-value="selectedBlock.maxWidth"
              type="number"
              min="240"
              max="960"
              outlined
              dense
              label="Max width (px)"
              hint="The sign-in card will not grow past this size."
              :disable="!canEdit"
              @update:model-value="updateSelected({ maxWidth: Number($event) })"
            />
            <q-btn-toggle
              class="login-designer__toggle"
              unelevated
              no-caps
              spread
              :model-value="selectedBlock.align"
              :disable="!canEdit"
              :options="alignOptions"
              @update:model-value="updateSelected({ align: $event })"
            />
          </div>
          <div class="column q-gutter-sm q-mt-md">
            <q-btn outline no-caps label="Bring forward" :disable="!canEdit" @click="shiftZ(1)" />
            <q-btn outline no-caps label="Send back" :disable="!canEdit" @click="shiftZ(-1)" />
            <q-btn
              v-if="selectedBlock.type !== 'form'"
              outline
              no-caps
              color="negative"
              label="Remove block"
              :disable="!canEdit"
              @click="removeSelected"
            />
          </div>
        </template>
      </aside>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { usePermissions } from '@core/composables/usePermissions';
import LoginPageStage from '@core/components/login-page/LoginPageStage.vue';
import {
  createBlock,
  emptyLayout,
  useLoginPageStore,
  type LoginBlockType,
  type LoginPageBlock,
} from '@core/stores/login-page-store';

const $q = useQuasar();
const store = useLoginPageStore();
const { can } = usePermissions();
const canEdit = computed(() => can('login-page-crud'));
const selectedId = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const palette: Array<{ type: LoginBlockType; label: string; icon: string }> = [
  { type: 'heading', label: 'Heading', icon: 'title' },
  { type: 'message', label: 'Message', icon: 'notes' },
  { type: 'image', label: 'Image', icon: 'image' },
  { type: 'form', label: 'Login form', icon: 'login' },
];

const backgroundOptions = [
  { label: 'Color', value: 'color' },
  { label: 'Image', value: 'image' },
  { label: 'Carousel', value: 'carousel' },
];

const alignOptions = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
];

const selectedBlock = computed(
  () => store.layout.blocks.find((block) => block.id === selectedId.value) ?? null,
);

const selectedLabel = computed(() => {
  const type = selectedBlock.value?.type;
  if (type === 'form') {
    return 'Login form';
  }
  if (type === 'heading') {
    return 'Heading';
  }
  if (type === 'message') {
    return 'Message';
  }
  return 'Image';
});

const imageOptions = computed(() =>
  store.layout.images.map((image, index) => ({
    label: `Image ${index + 1}`,
    value: image.id,
  })),
);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function updateBlock(id: string, patch: Partial<LoginPageBlock>) {
  const index = store.layout.blocks.findIndex((block) => block.id === id);
  if (index < 0) {
    return;
  }

  const current = store.layout.blocks[index];
  if (!current) {
    return;
  }

  const next = { ...current, ...patch };
  if (patch.width != null) {
    next.width = clamp(next.width, 8, 100 - next.x);
  }
  if (patch.height != null) {
    next.height = clamp(next.height, 6, 100 - next.y);
  }
  if (patch.x != null) {
    next.x = clamp(next.x, 0, 100 - next.width);
  }
  if (patch.y != null) {
    next.y = clamp(next.y, 0, 100 - next.height);
  }
  if (patch.fontSize != null) {
    next.fontSize = clamp(next.fontSize, 10, 72);
  }
  if (patch.maxWidth != null) {
    next.maxWidth = current.type === 'form' ? clamp(next.maxWidth, 240, 960) : 0;
  }
  if (patch.align && !['left', 'center', 'right'].includes(patch.align)) {
    next.align = current.align;
  }
  store.layout.blocks.splice(index, 1, next);
}

function updateSelected(patch: Partial<LoginPageBlock>) {
  if (!selectedId.value) {
    return;
  }
  updateBlock(selectedId.value, patch);
}

function addBlock(type: LoginBlockType, x?: number, y?: number) {
  if (!canEdit.value) {
    return;
  }

  const offset = store.layout.blocks.filter((block) => block.type === type).length * 4;
  const nextX = x ?? 12 + offset;
  const nextY = y ?? 12 + offset;

  if (type === 'form') {
    const form = store.layout.blocks.find((block) => block.type === 'form');
    if (form) {
      if (x != null && y != null) {
        updateBlock(form.id, { x: nextX, y: nextY });
      }
      selectedId.value = form.id;
      return;
    }
  }

  const block = createBlock(type, nextX, nextY);
  if (type === 'image' && store.layout.images[0]) {
    block.imageId = store.layout.images[0].id;
  }
  const maxZ = store.layout.blocks.reduce((max, item) => Math.max(max, item.zIndex), 1);
  block.zIndex = maxZ + 1;
  store.layout.blocks.push(block);
  selectedId.value = block.id;
}

function onPaletteDragStart(type: LoginBlockType, event: DragEvent) {
  if (!canEdit.value) {
    event.preventDefault();
    return;
  }
  event.dataTransfer?.setData('application/x-login-block', type);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy';
  }
}

function onMove(id: string, x: number, y: number) {
  const block = store.layout.blocks.find((item) => item.id === id);
  if (!block) {
    return;
  }
  updateBlock(id, {
    x: clamp(x, 0, 100 - block.width),
    y: clamp(y, 0, 100 - block.height),
  });
}

function onResize(id: string, width: number, height: number) {
  const block = store.layout.blocks.find((item) => item.id === id);
  if (!block) {
    return;
  }
  updateBlock(id, {
    width: clamp(width, 8, 100 - block.x),
    height: clamp(height, 6, 100 - block.y),
  });
}

function onCarouselSeconds(value: string | number | null) {
  store.layout.carouselIntervalMs = clamp(Number(value) * 1000, 2000, 30000);
}

function toggleBackground(imageId: string) {
  const ids = [...store.layout.backgroundImageIds];
  const index = ids.indexOf(imageId);
  if (index >= 0) {
    ids.splice(index, 1);
  } else {
    ids.push(imageId);
  }
  store.layout.backgroundImageIds = ids;
  if (ids.length === 0) {
    store.layout.backgroundMode = 'color';
    return;
  }
  if (ids.length === 1 && store.layout.backgroundMode === 'color') {
    store.layout.backgroundMode = 'image';
    return;
  }
  if (ids.length > 1) {
    store.layout.backgroundMode = 'carousel';
  }
}

function assignImage(imageId: string) {
  if (selectedBlock.value?.type !== 'image') {
    return;
  }
  updateSelected({ imageId });
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) {
    return;
  }

  try {
    const image = await store.uploadImage(file);
    if (image && selectedBlock.value?.type === 'image' && !selectedBlock.value.imageId) {
      updateSelected({ imageId: image.id });
    }
    if (store.layout.backgroundImageIds.length === 0) {
      store.layout.backgroundImageIds = [image.id];
      if (store.layout.backgroundMode === 'color') {
        store.layout.backgroundMode = 'image';
      }
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to upload image.',
    });
  }
}

async function removeImage(imageId: string) {
  try {
    await store.removeImage(imageId);
    if (selectedBlock.value?.imageId === imageId) {
      updateSelected({ imageId: null });
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to remove image.',
    });
  }
}

function shiftZ(delta: number) {
  if (!selectedBlock.value) {
    return;
  }
  updateSelected({ zIndex: Math.max(1, selectedBlock.value.zIndex + delta) });
}

function removeSelected() {
  if (!selectedBlock.value || selectedBlock.value.type === 'form') {
    return;
  }
  store.layout.blocks = store.layout.blocks.filter((block) => block.id !== selectedId.value);
  selectedId.value = null;
}

function resetLayout() {
  const current = store.layout;
  store.layout = {
    ...emptyLayout(),
    images: current.images,
    backgroundImageIds: current.backgroundImageIds,
    backgroundMode: current.backgroundMode,
    backgroundColor: current.backgroundColor,
    carouselIntervalMs: current.carouselIntervalMs,
  };
  selectedId.value = store.layout.blocks.find((block) => block.type === 'form')?.id ?? null;
}

async function save() {
  try {
    await store.saveSettings();
    $q.notify({ type: 'positive', message: 'Login page saved.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save login page.',
    });
  }
}

onMounted(async () => {
  try {
    await store.fetchSettings();
    selectedId.value = store.layout.blocks.find((block) => block.type === 'form')?.id ?? null;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to load login page settings.',
    });
  }
});
</script>

<style scoped>
.login-designer {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 100px);
  color: #0f172a;
  background: #f1f5f9;
}

.login-designer__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.login-designer__body {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 260px;
  gap: 16px;
  flex: 1;
  min-height: 520px;
}

.login-designer__panel {
  min-height: 0;
  padding: 12px;
  overflow: auto;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  background: #fff;
}

.login-designer__palette {
  display: grid;
  gap: 8px;
}

.login-designer__chip {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border: 1px dashed rgba(15, 23, 42, 0.18);
  border-radius: 10px;
  background: #f8fafc;
  color: inherit;
  cursor: grab;
}

.login-designer__chip:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.login-designer__toggle {
  width: 100%;
}

.login-designer__images {
  display: grid;
  gap: 8px;
}

.login-designer__image {
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 10px;
}

.login-designer__image img {
  display: block;
  width: 100%;
  height: 88px;
  object-fit: cover;
  background: #0f172a;
}

.login-designer__image-actions {
  display: flex;
  align-items: center;
  padding: 4px 8px;
}

.login-designer__canvas {
  position: relative;
  min-height: 480px;
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
}

.login-designer__swatch {
  width: 42px;
  height: 40px;
  padding: 0;
  border: 1px solid rgba(15, 23, 42, 0.16);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}

.login-designer__swatch:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.hidden {
  display: none;
}

@media (max-width: 1100px) {
  .login-designer__body {
    grid-template-columns: 1fr;
  }

  .login-designer__canvas {
    min-height: 420px;
    aspect-ratio: 16 / 10;
  }
}
</style>

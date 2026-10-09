<template>
  <q-page class="login-designer q-pa-md">
    <div class="login-designer__header">
      <div>
        <div class="text-h6" data-onboarding="admin-settings">Login Page</div>
        <div class="text-body2 text-grey-7">
          The canvas is a grid. Drop headings, messages, images, or the sign-in form onto cells,
          then stretch them across the portions you want.
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
      <div class="login-designer__canvas">
        <q-inner-loading :showing="store.isLoading">
          <q-spinner color="primary" size="32px" />
        </q-inner-loading>
        <LoginPageStage
          :layout="store.layout"
          editable
          :selected-ids="selectedIds"
          @select="onSelect"
          @move="onMove"
          @resize="onResize"
          @drop-block="addBlock"
          @drop-image="onDropImage"
          @drop-file="onDropFile"
          @request-upload="onRequestUpload"
        />
      </div>

      <aside class="login-designer__panel login-designer__panel--tools">
        <input
          ref="fileInputRef"
          class="hidden"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          @change="onFileChange"
        />
        <q-tabs
          v-model="leftTab"
          dense
          no-caps
          align="justify"
          active-color="primary"
          indicator-color="primary"
          class="login-designer__tabs"
        >
          <q-tab name="blocks" icon="widgets">
            <q-tooltip>Blocks</q-tooltip>
          </q-tab>
          <q-tab name="general" icon="tune">
            <q-tooltip>General settings</q-tooltip>
          </q-tab>
        </q-tabs>
        <q-tab-panels v-model="leftTab" animated class="login-designer__tab-panels">
          <q-tab-panel name="blocks" class="q-pa-none q-pt-sm">
            <div class="login-designer__palette">
              <button
                type="button"
                class="login-designer__chip"
                :draggable="canEdit"
                :disabled="!canEdit"
                @dragstart="onHeadingDragStart(paletteHeadingLevel, $event)"
                @click="addHeadingFromPalette"
              >
                <q-icon name="title" size="14px" />
                <span>Heading</span>
              </button>
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
                <q-icon :name="item.icon" size="14px" />
                <span>{{ item.label }}</span>
              </button>
            </div>
            <div class="login-designer__headings q-mt-xs">
              <button
                v-for="level in headingLevels"
                :key="`h${level}`"
                type="button"
                class="login-designer__heading-chip"
                :class="{ 'login-designer__heading-chip--active': paletteHeadingLevel === level }"
                :draggable="canEdit"
                :disabled="!canEdit"
                @dragstart="onHeadingDragStart(level, $event)"
                @click="onPaletteHeadingClick(level)"
              >
                H{{ level }}
              </button>
            </div>

            <div class="login-designer__selected-rule" />
            <div class="login-designer__selected">
              <div class="text-subtitle2 q-mb-sm">Selected</div>
              <div v-if="selectedIds.length === 0" class="text-caption text-grey-7">
                Click a block on the canvas, or drag one from the palette.
              </div>
              <div v-else-if="selectedIds.length > 1">
                <div class="text-caption text-grey-7 q-mb-sm">
                  {{ selectedIds.length }} blocks selected
                </div>
                <div class="login-designer__icon-row">
                  <q-btn
                    dense
                    outline
                    round
                    size="sm"
                    icon="flip_to_front"
                    :disable="!canEdit"
                    @click="shiftZ(1)"
                  >
                    <q-tooltip>Bring forward</q-tooltip>
                  </q-btn>
                  <q-btn
                    dense
                    outline
                    round
                    size="sm"
                    icon="flip_to_back"
                    :disable="!canEdit"
                    @click="shiftZ(-1)"
                  >
                    <q-tooltip>Send back</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="canRemoveSelection"
                    dense
                    outline
                    round
                    size="sm"
                    color="negative"
                    icon="delete"
                    :disable="!canEdit"
                    @click="removeSelected"
                  >
                    <q-tooltip>Remove blocks</q-tooltip>
                  </q-btn>
                </div>
              </div>
              <template v-else-if="selectedBlock">
                <div class="text-caption text-grey-7 q-mb-sm">{{ selectedLabel }}</div>
                <div v-if="selectedBlock.type === 'heading'" class="login-designer__headings q-mb-sm">
                  <button
                    v-for="level in headingLevels"
                    :key="`selected-h${level}`"
                    type="button"
                    class="login-designer__heading-chip"
                    :class="{ 'login-designer__heading-chip--active': selectedBlock.headingLevel === level }"
                    :disabled="!canEdit"
                    @click="onHeadingLevelChange(level)"
                  >
                    H{{ level }}
                  </button>
                </div>
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
                <div
                  v-if="selectedBlock.type === 'heading' || selectedBlock.type === 'message' || selectedBlock.type === 'form'"
                  class="row items-center no-wrap q-gutter-sm q-mt-sm"
                >
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
                    :label="selectedBlock.type === 'form' ? 'Text color' : 'Color'"
                    :disable="!canEdit"
                    @update:model-value="updateSelected({ color: String($event ?? '#ffffff') })"
                  />
                </div>
                <div
                  v-if="selectedBlock.type === 'heading' || selectedBlock.type === 'message'"
                  class="login-designer__icon-row q-mt-sm"
                >
                  <q-btn
                    v-for="item in alignIcons"
                    :key="item.value"
                    dense
                    flat
                    round
                    size="sm"
                    :icon="item.icon"
                    :color="selectedBlock.align === item.value ? 'primary' : undefined"
                    :disable="!canEdit"
                    @click="updateSelected({ align: item.value })"
                  >
                    <q-tooltip>{{ item.label }}</q-tooltip>
                  </q-btn>
                </div>
                <q-select
                  v-if="selectedBlock.type === 'image'"
                  class="q-mt-sm"
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
                <q-btn
                  v-if="selectedBlock.type === 'image'"
                  class="q-mt-sm"
                  outline
                  no-caps
                  color="primary"
                  icon="upload"
                  label="Upload into this block"
                  :loading="store.isUploading"
                  :disable="!canEdit"
                  @click="fileInputRef?.click()"
                />
                <div v-if="selectedBlock.type === 'form'" class="column q-gutter-sm q-mt-sm">
                  <div class="text-caption text-grey-7">Login card</div>
                  <div class="row items-center no-wrap q-gutter-sm">
                    <input
                      class="login-designer__swatch"
                      type="color"
                      v-model="selectedBlock.cardBackground"
                      :disabled="!canEdit"
                    />
                    <q-input
                      class="col"
                      :model-value="selectedBlock.cardBackground"
                      outlined
                      dense
                      label="Background color"
                      :disable="!canEdit"
                      @update:model-value="updateSelected({ cardBackground: String($event ?? '#ffffff') })"
                    />
                  </div>
                  <div class="row items-center no-wrap q-gutter-sm">
                    <input
                      class="login-designer__swatch"
                      type="color"
                      v-model="selectedBlock.cardBorderColor"
                      :disabled="!canEdit"
                    />
                    <q-input
                      class="col"
                      :model-value="selectedBlock.cardBorderColor"
                      outlined
                      dense
                      label="Border color"
                      :disable="!canEdit"
                      @update:model-value="updateSelected({ cardBorderColor: String($event ?? '#e2e8f0') })"
                    />
                  </div>
                  <q-input
                    :model-value="selectedBlock.cardBorderWidth"
                    type="number"
                    min="0"
                    max="12"
                    outlined
                    dense
                    label="Border width"
                    :disable="!canEdit"
                    @update:model-value="updateSelected({ cardBorderWidth: Number($event) })"
                  />
                  <q-input
                    :model-value="selectedBlock.cardRadius"
                    type="number"
                    min="0"
                    max="48"
                    outlined
                    dense
                    label="Corner radius"
                    :disable="!canEdit"
                    @update:model-value="updateSelected({ cardRadius: Number($event) })"
                  />
                  <div class="login-designer__shadows">
                    <button
                      v-for="item in shadowOptions"
                      :key="item.value"
                      type="button"
                      class="login-designer__shadow-chip"
                      :class="{ 'login-designer__shadow-chip--active': selectedBlock.cardShadow === item.value }"
                      :disabled="!canEdit"
                      @click="updateSelected({ cardShadow: item.value })"
                    >
                      <span
                        class="login-designer__shadow-preview"
                        :style="{ boxShadow: formCardShadow(item.value) }"
                      />
                      <span>{{ item.label }}</span>
                    </button>
                  </div>
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
                  <div class="login-designer__icon-row">
                    <q-btn
                      v-for="item in alignIcons"
                      :key="`form-${item.value}`"
                      dense
                      flat
                      round
                      size="sm"
                      :icon="item.icon"
                      :color="selectedBlock.align === item.value ? 'primary' : undefined"
                      :disable="!canEdit"
                      @click="updateSelected({ align: item.value })"
                    >
                      <q-tooltip>{{ item.label }}</q-tooltip>
                    </q-btn>
                  </div>
                </div>
                <div class="login-designer__icon-row q-mt-md">
                  <q-btn
                    dense
                    outline
                    round
                    size="sm"
                    icon="flip_to_front"
                    :disable="!canEdit"
                    @click="shiftZ(1)"
                  >
                    <q-tooltip>Bring forward</q-tooltip>
                  </q-btn>
                  <q-btn
                    dense
                    outline
                    round
                    size="sm"
                    icon="flip_to_back"
                    :disable="!canEdit"
                    @click="shiftZ(-1)"
                  >
                    <q-tooltip>Send back</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="selectedBlock.type !== 'form'"
                    dense
                    outline
                    round
                    size="sm"
                    color="negative"
                    icon="delete"
                    :disable="!canEdit"
                    @click="removeSelected"
                  >
                    <q-tooltip>Remove block</q-tooltip>
                  </q-btn>
                </div>
              </template>
            </div>
          </q-tab-panel>
          <q-tab-panel name="general" class="q-pa-none q-pt-sm">
            <div class="text-subtitle2 q-mb-sm">Grid</div>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  :model-value="store.layout.gridColumns"
                  type="number"
                  min="2"
                  max="24"
                  outlined
                  dense
                  label="Columns"
                  :disable="!canEdit"
                  @update:model-value="setGridSize('gridColumns', Number($event))"
                />
              </div>
              <div class="col-6">
                <q-input
                  :model-value="store.layout.gridRows"
                  type="number"
                  min="2"
                  max="24"
                  outlined
                  dense
                  label="Rows"
                  :disable="!canEdit"
                  @update:model-value="setGridSize('gridRows', Number($event))"
                />
              </div>
            </div>
            <div class="text-caption text-grey-7 q-mt-xs">
              Blocks snap to these cells. Change the size to split the page into larger or smaller portions.
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
              Upload photos, then drag one onto a grid cell or use it as the page background.
            </div>
            <div class="login-designer__images q-mt-sm">
              <div v-for="image in store.layout.images" :key="image.id" class="login-designer__image">
                <img
                  :src="image.url || ''"
                  alt=""
                  :draggable="canEdit"
                  @click="assignImage(image.id)"
                  @dragstart="onImageDragStart(image.id, $event)"
                />
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
                    :disable="!canEdit"
                    @click="assignImage(image.id)"
                  >
                    <q-tooltip>Use on the selected image block</q-tooltip>
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
          </q-tab-panel>
        </q-tab-panels>
      </aside>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { usePermissions } from '@core/composables/usePermissions';
import LoginPageStage, { type LoginSelectPayload } from '@core/components/login-page/LoginPageStage.vue';
import {
  clampGridSize,
  createBlock,
  DEFAULT_GRID_COLUMNS,
  DEFAULT_GRID_ROWS,
  emptyLayout,
  formCardShadow,
  headingFontSize,
  normalizeHeadingLevel,
  placementFromGrid,
  snapRectToGrid,
  useLoginPageStore,
  type LoginBlockType,
  type LoginHeadingLevel,
  type LoginPageBlock,
  type LoginTextAlign,
} from '@core/stores/login-page-store';

const $q = useQuasar();
const store = useLoginPageStore();
const { can } = usePermissions();
const canEdit = computed(() => can('login-page-crud'));
const selectedIds = ref<string[]>([]);
const selectionAnchor = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const leftTab = ref<'blocks' | 'general'>('blocks');
const paletteHeadingLevel = ref<LoginHeadingLevel>(1);

const palette: Array<{ type: LoginBlockType; label: string; icon: string }> = [
  { type: 'message', label: 'Message', icon: 'notes' },
  { type: 'image', label: 'Image', icon: 'image' },
  { type: 'form', label: 'Form', icon: 'login' },
];

const headingLevels: LoginHeadingLevel[] = [1, 2, 3, 4, 5, 6];
const shadowOptions = [
  { label: 'None', value: 0 },
  { label: 'Soft', value: 1 },
  { label: 'Medium', value: 2 },
  { label: 'Strong', value: 3 },
];

const backgroundOptions = [
  { label: 'Color', value: 'color' },
  { label: 'Image', value: 'image' },
  { label: 'Carousel', value: 'carousel' },
];

const alignIcons: Array<{ label: string; value: LoginTextAlign; icon: string }> = [
  { label: 'Left', value: 'left', icon: 'format_align_left' },
  { label: 'Center', value: 'center', icon: 'format_align_center' },
  { label: 'Right', value: 'right', icon: 'format_align_right' },
];

const selectedBlock = computed(() => {
  if (selectedIds.value.length !== 1) {
    return null;
  }
  const id = selectedIds.value[0];
  return store.layout.blocks.find((block) => block.id === id) ?? null;
});

const canRemoveSelection = computed(() =>
  selectedIds.value.some((id) => store.layout.blocks.find((block) => block.id === id)?.type !== 'form'),
);

const selectedLabel = computed(() => {
  const type = selectedBlock.value?.type;
  if (type === 'form') {
    return 'Login form';
  }
  if (type === 'heading') {
    return `Heading H${selectedBlock.value?.headingLevel || 1}`;
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
  const gridChanged = ['col', 'row', 'colSpan', 'rowSpan'].some((key) => patch[key as keyof LoginPageBlock] != null);
  const boxChanged = ['x', 'y', 'width', 'height'].some((key) => patch[key as keyof LoginPageBlock] != null);
  if (gridChanged) {
    Object.assign(next, placementFromGrid(
      next.col,
      next.row,
      next.colSpan,
      next.rowSpan,
      store.layout.gridColumns,
      store.layout.gridRows,
    ));
  } else if (boxChanged) {
    Object.assign(next, snapRectToGrid(
      next.x,
      next.y,
      next.width,
      next.height,
      store.layout.gridColumns,
      store.layout.gridRows,
    ));
  }
  if (patch.fontSize != null) {
    next.fontSize = clamp(next.fontSize, 10, 72);
  }
  if (patch.maxWidth != null) {
    next.maxWidth = current.type === 'form' ? clamp(next.maxWidth, 240, 960) : 0;
  }
  if (patch.headingLevel != null) {
    next.headingLevel = normalizeHeadingLevel(patch.headingLevel);
  }
  if (patch.cardBorderWidth != null) {
    next.cardBorderWidth = clamp(next.cardBorderWidth, 0, 12);
  }
  if (patch.cardRadius != null) {
    next.cardRadius = clamp(next.cardRadius, 0, 48);
  }
  if (patch.cardShadow != null) {
    next.cardShadow = clamp(next.cardShadow, 0, 3);
  }
  if (patch.align && !['left', 'center', 'right'].includes(patch.align)) {
    next.align = current.align;
  }
  store.layout.blocks.splice(index, 1, next);
}

function selectOnly(id: string | null) {
  selectedIds.value = id ? [id] : [];
  selectionAnchor.value = id;
}

function onSelect(payload: LoginSelectPayload) {
  if (!payload.id) {
    selectedIds.value = [];
    return;
  }

  const id = payload.id;
  if (payload.additive) {
    selectedIds.value = selectedIds.value.includes(id)
      ? selectedIds.value.filter((item) => item !== id)
      : [...selectedIds.value, id];
    selectionAnchor.value = id;
    return;
  }

  if (payload.range && selectionAnchor.value) {
    const order = [...store.layout.blocks]
      .sort((left, right) => left.y - right.y || left.x - right.x || left.zIndex - right.zIndex)
      .map((block) => block.id);
    const from = order.indexOf(selectionAnchor.value);
    const to = order.indexOf(id);
    if (from >= 0 && to >= 0) {
      const start = Math.min(from, to);
      const end = Math.max(from, to);
      selectedIds.value = order.slice(start, end + 1);
      return;
    }
  }

  selectOnly(id);
}

function updateSelected(patch: Partial<LoginPageBlock>) {
  const id = selectedIds.value.length === 1 ? selectedIds.value[0] : null;
  if (!id) {
    return;
  }
  updateBlock(id, patch);
}

function addBlock(type: LoginBlockType, x?: number, y?: number, extras: Partial<LoginPageBlock> = {}) {
  if (!canEdit.value) {
    return;
  }

  const columns = store.layout.gridColumns;
  const rows = store.layout.gridRows;
  const offset = store.layout.blocks.filter((block) => block.type === type).length;
  const nextX = x ?? (offset % columns) * (100 / columns);
  const nextY = y ?? Math.min(offset, rows - 1) * (100 / rows);

  if (type === 'form') {
    const form = store.layout.blocks.find((block) => block.type === 'form');
    if (form) {
      if (x != null && y != null) {
        updateBlock(form.id, { x: nextX, y: nextY, width: form.width, height: form.height });
      }
      selectOnly(form.id);
      return;
    }
  }

  const block = createBlock(type, nextX, nextY, columns, rows, extras);
  if (type === 'image' && store.layout.images[0]) {
    block.imageId = store.layout.images[0].id;
  }
  const maxZ = store.layout.blocks.reduce((max, item) => Math.max(max, item.zIndex), 1);
  block.zIndex = maxZ + 1;
  store.layout.blocks.push(block);
  selectOnly(block.id);
}

function onHeadingLevelChange(level: number) {
  const next = normalizeHeadingLevel(level);
  updateSelected({
    headingLevel: next,
    fontSize: headingFontSize(next),
  });
}

function addHeadingFromPalette() {
  addBlock('heading', undefined, undefined, { headingLevel: paletteHeadingLevel.value });
}

function onPaletteHeadingClick(level: LoginHeadingLevel) {
  paletteHeadingLevel.value = level;
  addBlock('heading', undefined, undefined, { headingLevel: level });
}

function onHeadingDragStart(level: LoginHeadingLevel, event: DragEvent) {
  if (!canEdit.value) {
    event.preventDefault();
    return;
  }
  event.dataTransfer?.setData('application/x-login-block', `block:heading:${level}`);
  event.dataTransfer?.setData('text/plain', `block:heading:${level}`);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy';
  }
}

function onDropImage(imageId: string, x: number, y: number) {
  if (!canEdit.value) {
    return;
  }

  const hit = [...store.layout.blocks]
    .sort((left, right) => right.zIndex - left.zIndex)
    .find((block) => (
      x >= block.x
      && x <= block.x + block.width
      && y >= block.y
      && y <= block.y + block.height
      && block.type === 'image'
    ));
  if (hit) {
    selectOnly(hit.id);
    updateBlock(hit.id, { imageId });
    return;
  }

  addBlock('image', x, y);
  updateSelected({ imageId });
}

function onImageDragStart(imageId: string, event: DragEvent) {
  if (!canEdit.value) {
    event.preventDefault();
    return;
  }
  event.dataTransfer?.setData('application/x-login-image', `image:${imageId}`);
  event.dataTransfer?.setData('text/plain', `image:${imageId}`);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy';
  }
}

function onPaletteDragStart(type: LoginBlockType, event: DragEvent) {
  if (!canEdit.value) {
    event.preventDefault();
    return;
  }
  event.dataTransfer?.setData('application/x-login-block', `block:${type}`);
  event.dataTransfer?.setData('text/plain', `block:${type}`);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy';
  }
}

function setGridSize(key: 'gridColumns' | 'gridRows', value: number) {
  const fallback = key === 'gridColumns' ? DEFAULT_GRID_COLUMNS : DEFAULT_GRID_ROWS;
  const nextSize = clampGridSize(value, fallback);
  store.layout[key] = nextSize;
  store.layout.blocks = store.layout.blocks.map((block) => ({
    ...block,
    ...placementFromGrid(
      block.col,
      block.row,
      block.colSpan,
      block.rowSpan,
      store.layout.gridColumns,
      store.layout.gridRows,
    ),
  }));
}

function onMove(id: string, x: number, y: number) {
  const block = store.layout.blocks.find((item) => item.id === id);
  if (!block) {
    return;
  }

  const dx = x - block.x;
  const dy = y - block.y;
  const movingIds = selectedIds.value.includes(id) && selectedIds.value.length > 1
    ? selectedIds.value
    : [id];

  movingIds.forEach((moveId) => {
    const item = store.layout.blocks.find((candidate) => candidate.id === moveId);
    if (!item) {
      return;
    }
    if (moveId === id) {
      updateBlock(id, { x, y, width: item.width, height: item.height });
      return;
    }
    updateBlock(moveId, {
      x: item.x + dx,
      y: item.y + dy,
      width: item.width,
      height: item.height,
    });
  });
}

function onResize(id: string, width: number, height: number) {
  const block = store.layout.blocks.find((item) => item.id === id);
  if (!block) {
    return;
  }
  updateBlock(id, { x: block.x, y: block.y, width, height });
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
  if (!canEdit.value) {
    return;
  }

  if (selectedBlock.value?.type === 'image') {
    updateSelected({ imageId });
    return;
  }

  const existing = store.layout.blocks.find((block) => block.type === 'image');
  if (existing) {
    selectOnly(existing.id);
    updateBlock(existing.id, { imageId });
    return;
  }

  addBlock('image');
  updateSelected({ imageId });
}

async function applyUploadedImage(file: File, targetId?: string | null) {
  const image = await store.uploadImage(file);
  if (!image?.id) {
    return;
  }

  const blockId = targetId || (selectedBlock.value?.type === 'image' ? selectedBlock.value.id : null);
  if (blockId) {
    selectOnly(blockId);
    updateBlock(blockId, { imageId: image.id });
    return;
  }

  addBlock('image');
  updateSelected({ imageId: image.id });
}

function onRequestUpload(id: string) {
  if (!canEdit.value) {
    return;
  }
  selectOnly(id);
  fileInputRef.value?.click();
}

async function onDropFile(file: File, x: number, y: number) {
  if (!canEdit.value) {
    return;
  }

  const hit = [...store.layout.blocks]
    .sort((left, right) => right.zIndex - left.zIndex)
    .find((block) => (
      x >= block.x
      && x <= block.x + block.width
      && y >= block.y
      && y <= block.y + block.height
      && block.type === 'image'
    ));

  try {
    if (hit) {
      selectOnly(hit.id);
      await applyUploadedImage(file, hit.id);
      return;
    }

    addBlock('image', x, y);
    await applyUploadedImage(file, selectedIds.value[0] ?? null);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to upload image.',
    });
  }
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) {
    return;
  }

  try {
    await applyUploadedImage(file, selectedBlock.value?.type === 'image' ? selectedBlock.value.id : null);
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
  selectedIds.value.forEach((id) => {
    const block = store.layout.blocks.find((item) => item.id === id);
    if (!block) {
      return;
    }
    updateBlock(id, { zIndex: Math.max(1, block.zIndex + delta) });
  });
}

function removeSelected() {
  const removable = new Set(
    selectedIds.value.filter((id) => store.layout.blocks.find((block) => block.id === id)?.type !== 'form'),
  );
  if (removable.size === 0) {
    return;
  }
  store.layout.blocks = store.layout.blocks.filter((block) => !removable.has(block.id));
  selectedIds.value = selectedIds.value.filter((id) => !removable.has(id));
  if (!selectedIds.value.includes(selectionAnchor.value || '')) {
    selectionAnchor.value = selectedIds.value[0] ?? null;
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

function onDesignerKeydown(event: KeyboardEvent) {
  if (!canEdit.value || (event.key !== 'Delete' && event.key !== 'Backspace')) {
    return;
  }
  if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }
  if (!canRemoveSelection.value) {
    return;
  }

  event.preventDefault();
  removeSelected();
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
  selectOnly(store.layout.blocks.find((block) => block.type === 'form')?.id ?? null);
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
  window.addEventListener('keydown', onDesignerKeydown);
  try {
    await store.fetchSettings();
    selectOnly(store.layout.blocks.find((block) => block.type === 'form')?.id ?? null);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to load login page settings.',
    });
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', onDesignerKeydown);
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
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 12px;
  flex: 1;
  min-height: 520px;
}

.login-designer__panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  background: #fff;
}

.login-designer__panel--tools {
  padding: 0;
}

.login-designer__tabs {
  min-height: 42px;
  padding: 6px 8px 0;
  background: #e2e8f0;
  border-bottom: 1px solid #cbd5e1;
}

.login-designer__tabs :deep(.q-tab) {
  min-height: 36px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  color: #64748b;
  opacity: 1;
}

.login-designer__tabs :deep(.q-tab__content) {
  min-height: 36px;
}

.login-designer__tabs :deep(.q-tab--inactive) {
  background: rgba(255, 255, 255, 0.45);
  color: #64748b;
}

.login-designer__tabs :deep(.q-tab--active) {
  background: #fff;
  color: #2563eb;
  border-color: #cbd5e1;
  border-bottom-color: #fff;
  margin-bottom: -1px;
}

.login-designer__tabs :deep(.q-tab__indicator) {
  height: 2px;
  border-radius: 2px 2px 0 0;
}

.login-designer__tab-panels {
  flex: 1;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
  background: #fff;
}

.login-designer__tab-panels :deep(.q-tab-panel) {
  overflow: auto;
}

.login-designer__selected-rule {
  height: 3px;
  margin: 18px 0 14px;
  border: none;
  border-radius: 2px;
  background: #94a3b8;
}

.login-designer__selected {
  padding: 0;
  background: transparent;
}

.login-designer__shadows {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.login-designer__shadow-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 2px 6px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-size: 10px;
  line-height: 1.1;
  cursor: pointer;
}

.login-designer__shadow-chip--active {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
  color: #2563eb;
}

.login-designer__shadow-chip:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.login-designer__shadow-preview {
  display: block;
  width: 28px;
  height: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #fff;
  box-shadow: none;
}

.login-designer__selected .login-designer__heading-chip {
  cursor: pointer;
}

.login-designer__selected .login-designer__swatch {
  width: 32px;
  height: 32px;
}

.login-designer__icon-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.login-designer__palette {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.login-designer__chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 100%;
  min-height: 44px;
  padding: 4px 2px;
  border: 1px dashed rgba(15, 23, 42, 0.18);
  border-radius: 8px;
  background: #f8fafc;
  color: inherit;
  font-size: 10px;
  line-height: 1.1;
  cursor: grab;
}

.login-designer__chip:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.login-designer__headings {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 3px;
}

.login-designer__heading-chip {
  min-height: 22px;
  padding: 2px 0;
  border: 1px solid rgba(15, 23, 42, 0.16);
  border-radius: 4px;
  background: #f8fafc;
  color: inherit;
  font-size: 10px;
  font-weight: 650;
  line-height: 1;
  cursor: grab;
}

.login-designer__heading-chip--active {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.login-designer__heading-chip:disabled {
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
  cursor: grab;
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

@media (max-width: 860px) {
  .login-designer__body {
    grid-template-columns: 1fr;
  }

  .login-designer__canvas {
    order: -1;
    min-height: 360px;
    aspect-ratio: 16 / 10;
  }

  .login-designer__palette {
    max-width: 320px;
  }
}
</style>

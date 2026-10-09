<template>
  <div
    ref="stageRef"
    class="login-stage"
    :style="stageStyle"
    @pointerdown="onStagePointerDown"
    @dragover.capture.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.capture.prevent="onDrop"
  >
    <div
      v-for="(url, index) in backgroundUrls"
      :key="`${url}-${index}`"
      class="login-stage__bg"
      :class="{ 'login-stage__bg--active': index === backgroundIndex }"
      :style="{ backgroundImage: url ? `url(${url})` : 'none' }"
    />

    <div
      v-if="editable"
      class="login-stage__grid"
      :style="gridStyle"
    >
      <div
        v-for="index in gridCellCount"
        :key="index"
        class="login-stage__grid-cell"
        :class="{ 'login-stage__grid-cell--hover': hoverIndex === index - 1 }"
      />
    </div>


    <div
      v-for="block in orderedBlocks"
      :key="block.id"
      class="login-stage__block"
      :class="{
        'login-stage__block--editable': editable,
        'login-stage__block--selected': editable && isSelected(block.id),
      }"
      :style="blockStyle(block)"
      @pointerdown.stop="onBlockPointerDown($event, block, 'move')"
    >
      <component
        :is="`h${block.headingLevel || 1}`"
        v-if="block.type === 'heading'"
        class="login-stage__text login-stage__heading"
        :style="{ color: block.color, fontSize: `${block.fontSize}px`, textAlign: block.align }"
      >
        {{ block.text || 'Heading' }}
      </component>
      <div v-else-if="block.type === 'message'" class="login-stage__text login-stage__text--message" :style="{ color: block.color, fontSize: `${block.fontSize}px`, textAlign: block.align }">
        {{ block.text || 'Message' }}
      </div>
      <img
        v-else-if="block.type === 'image' && imageUrl(block.imageId)"
        class="login-stage__image"
        :src="imageUrl(block.imageId) ?? ''"
        alt=""
      />
      <div v-else-if="block.type === 'image'" class="login-stage__image-placeholder">
        <span>No image</span>
        <button
          v-if="editable"
          type="button"
          class="login-stage__upload"
          @pointerdown.stop
          @click.stop="emit('request-upload', block.id)"
        >
          Upload
        </button>
      </div>
      <div v-else-if="block.type === 'form'" class="login-stage__form">
        <div class="login-stage__form-card" :style="formCardStyle(block)">
          <LoginForm v-if="!editable" />
          <div v-else class="login-stage__form-preview">
            <div class="text-subtitle2">Login form</div>
            <div class="text-caption">Saved accounts, username, password, and sign-in actions land here.</div>
          </div>
        </div>
      </div>

      <button
        v-if="editable && isSelected(block.id)"
        type="button"
        class="login-stage__resize"
        aria-label="Resize"
        @pointerdown.stop="onBlockPointerDown($event, block, 'resize')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import LoginForm from '@core/components/LoginForm.vue';
import type { LoginBlockType, LoginPageBlock, LoginPageLayout } from '@core/stores/login-page-store';
import { cellFromPoint, formCardShadow, normalizeHeadingLevel } from '@core/stores/login-page-store';

export type LoginSelectPayload = {
  id: string | null;
  additive?: boolean;
  range?: boolean;
};

const props = withDefaults(defineProps<{
  layout: LoginPageLayout;
  editable?: boolean;
  selectedIds?: string[];
}>(), {
  editable: false,
  selectedIds: () => [],
});

const emit = defineEmits<{
  (event: 'select', payload: LoginSelectPayload): void;
  (event: 'move', id: string, x: number, y: number): void;
  (event: 'resize', id: string, width: number, height: number): void;
  (event: 'drop-block', type: LoginBlockType, x: number, y: number, extras?: Partial<LoginPageBlock>): void;
  (event: 'drop-image', imageId: string, x: number, y: number): void;
  (event: 'drop-file', file: File, x: number, y: number): void;
  (event: 'request-upload', id: string): void;
}>();

const stageRef = ref<HTMLElement | null>(null);
const backgroundIndex = ref(0);
const hoverCell = ref<{ col: number; row: number } | null>(null);
let carouselTimer: ReturnType<typeof setInterval> | null = null;
let drag: {
  mode: 'move' | 'resize';
  id: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  originW: number;
  originH: number;
} | null = null;

const orderedBlocks = computed(() =>
  [...props.layout.blocks].sort((left, right) => left.zIndex - right.zIndex),
);

const backgroundUrls = computed(() => {
  const images = props.layout.images;
  const ids = props.layout.backgroundImageIds.length
    ? props.layout.backgroundImageIds
    : images.map((image) => image.id);
  const urls = ids
    .map((id) => images.find((image) => image.id === id)?.url)
    .filter((url): url is string => Boolean(url));

  if (props.layout.backgroundMode === 'color' || urls.length === 0) {
    return [null];
  }

  if (props.layout.backgroundMode === 'image') {
    return [urls[0]];
  }

  return urls;
});

const stageStyle = computed(() => ({
  backgroundColor: props.layout.backgroundColor,
}));

const gridColumns = computed(() => props.layout.gridColumns || 24);
const gridRows = computed(() => props.layout.gridRows || 24);
const gridCellCount = computed(() => gridColumns.value * gridRows.value);
const hoverIndex = computed(() => {
  if (!hoverCell.value) {
    return -1;
  }

  return hoverCell.value.row * gridColumns.value + hoverCell.value.col;
});
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${gridColumns.value}, 1fr)`,
  gridTemplateRows: `repeat(${gridRows.value}, 1fr)`,
}));

function imageUrl(imageId: string | null): string | null {
  if (!imageId) {
    return null;
  }

  return props.layout.images.find((image) => image.id === imageId)?.url ?? null;
}

function blockStyle(block: LoginPageBlock) {
  return {
    left: `${block.x}%`,
    top: `${block.y}%`,
    width: `${block.width}%`,
    height: `${block.height}%`,
    zIndex: block.zIndex + (isSelected(block.id) ? 20 : 0),
  };
}

function formCardStyle(block: LoginPageBlock) {
  return {
    maxWidth: block.maxWidth > 0 ? `${block.maxWidth}px` : undefined,
    marginLeft: block.align === 'left' ? '0' : 'auto',
    marginRight: block.align === 'right' ? '0' : 'auto',
    background: block.cardBackground || '#ffffff',
    border: `${block.cardBorderWidth || 0}px solid ${block.cardBorderColor || 'transparent'}`,
    borderRadius: `${block.cardRadius ?? 12}px`,
    boxShadow: formCardShadow(block.cardShadow),
    color: block.color || '#0f172a',
  };
}

function percentFromEvent(event: DragEvent | PointerEvent): { x: number; y: number } {
  const rect = stageRef.value?.getBoundingClientRect();
  if (!rect || rect.width === 0 || rect.height === 0) {
    return { x: 10, y: 10 };
  }

  return {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
  };
}

function isSelected(id: string): boolean {
  return props.selectedIds.includes(id);
}

function onStagePointerDown(event: PointerEvent) {
  if (!props.editable || event.button !== 0) {
    return;
  }

  const target = event.target as HTMLElement | null;
  if (target?.closest('.login-stage__block')) {
    return;
  }

  emit('select', { id: null });
}

function onDragOver(event: DragEvent) {
  if (!props.editable) {
    return;
  }
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
  const point = percentFromEvent(event);
  hoverCell.value = cellFromPoint(point.x, point.y, gridColumns.value, gridRows.value);
}

function onDragLeave(event: DragEvent) {
  if (event.currentTarget === event.target) {
    hoverCell.value = null;
  }
}

function onDrop(event: DragEvent) {
  if (!props.editable) {
    return;
  }

  hoverCell.value = null;
  const point = percentFromEvent(event);
  const file = event.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) {
    emit('drop-file', file, point.x, point.y);
    return;
  }

  const raw = (
    event.dataTransfer?.getData('application/x-login-image')
    || event.dataTransfer?.getData('application/x-login-block')
    || event.dataTransfer?.getData('text/plain')
    || ''
  ).trim();

  if (raw.startsWith('image:')) {
    emit('drop-image', raw.slice('image:'.length), point.x, point.y);
    return;
  }

  const headingMatch = raw.match(/^(?:block:)?heading:([1-6])$/);
  if (headingMatch?.[1]) {
    emit('drop-block', 'heading', point.x, point.y, {
      headingLevel: normalizeHeadingLevel(headingMatch[1]),
    });
    return;
  }

  const type = raw.startsWith('block:') ? raw.slice('block:'.length) : raw;
  if (type !== 'form' && type !== 'heading' && type !== 'message' && type !== 'image') {
    return;
  }

  emit('drop-block', type, point.x, point.y);
}

function onBlockPointerDown(event: PointerEvent, block: LoginPageBlock, mode: 'move' | 'resize') {
  if (!props.editable || event.button !== 0) {
    return;
  }

  event.preventDefault();
  const additive = event.metaKey || event.ctrlKey;
  const range = event.shiftKey && !additive;
  emit('select', { id: block.id, additive, range });
  if (additive || range) {
    return;
  }

  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  drag = {
    mode,
    id: block.id,
    startX: event.clientX,
    startY: event.clientY,
    originX: block.x,
    originY: block.y,
    originW: block.width,
    originH: block.height,
  };
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function onPointerMove(event: PointerEvent) {
  if (!drag || !stageRef.value) {
    return;
  }

  const rect = stageRef.value.getBoundingClientRect();
  const dx = ((event.clientX - drag.startX) / rect.width) * 100;
  const dy = ((event.clientY - drag.startY) / rect.height) * 100;

  if (drag.mode === 'move') {
    emit('move', drag.id, drag.originX + dx, drag.originY + dy);
    return;
  }

  emit('resize', drag.id, drag.originW + dx, drag.originH + dy);
}

function onPointerUp() {
  drag = null;
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
}

function startCarousel() {
  if (carouselTimer) {
    clearInterval(carouselTimer);
    carouselTimer = null;
  }

  backgroundIndex.value = 0;
  if (props.layout.backgroundMode !== 'carousel' || backgroundUrls.value.length < 2) {
    return;
  }

  carouselTimer = setInterval(() => {
    backgroundIndex.value = (backgroundIndex.value + 1) % backgroundUrls.value.length;
  }, props.layout.carouselIntervalMs);
}

watch(
  () => [
    props.layout.backgroundMode,
    props.layout.carouselIntervalMs,
    props.layout.backgroundImageIds.join(','),
    props.layout.images.map((image) => image.id).join(','),
  ],
  startCarousel,
  { immediate: true },
);

onUnmounted(() => {
  if (carouselTimer) {
    clearInterval(carouselTimer);
  }
  onPointerUp();
});

</script>

<style scoped>
.login-stage {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  background-color: #0f172a;
}

.login-stage__bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.8s ease;
}

.login-stage__bg--active {
  opacity: 1;
}

.login-stage__grid {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  pointer-events: none;
}

.login-stage__grid-cell {
  border: 1px dashed rgba(255, 255, 255, 0.18);
}

.login-stage__grid-cell--hover {
  background: rgba(96, 165, 250, 0.22);
  border-color: rgba(96, 165, 250, 0.7);
}

.login-stage__block {
  position: absolute;
  z-index: 2;
  display: flex;
  min-width: 0;
  min-height: 0;
}

.login-stage__block--editable {
  cursor: move;
  user-select: none;
  touch-action: none;
  outline: 1px dashed rgba(255, 255, 255, 0.28);
}

.login-stage__block--selected {
  outline: 2px solid #60a5fa;
}

.login-stage__text {
  width: 100%;
  height: 100%;
  font-weight: 650;
  line-height: 1.2;
  overflow: hidden;
}

.login-stage__text--message {
  font-weight: 400;
  line-height: 1.4;
}

.login-stage__image,
.login-stage__image-placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.login-stage__image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
  font-size: 12px;
}

.login-stage__upload {
  padding: 4px 10px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.55);
  color: #fff;
  cursor: pointer;
}

.login-stage__form {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.login-stage__heading {
  margin: 0;
  font-weight: 650;
}

.login-stage__form-card {
  width: 100%;
  min-height: 100%;
  padding: 16px;
}

.login-stage__form-card :deep(.q-field__label),
.login-stage__form-card :deep(.q-field__native),
.login-stage__form-card :deep(.q-field__prefix),
.login-stage__form-card :deep(.q-item-label),
.login-stage__form-card :deep(.q-icon) {
  color: inherit;
}

.login-stage__form-preview {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100%;
}

.login-stage__resize {
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 14px;
  height: 14px;
  padding: 0;
  border: 2px solid #fff;
  border-radius: 3px;
  background: #2563eb;
  cursor: nwse-resize;
}
</style>

<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-xs">Document Headers</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Design the letterhead used on report Excel and PDF files. Company is the default for payroll reports.
      GOB is the default for government reports. Place text, company fields, and the logo anywhere on the canvas.
    </div>

    <q-banner v-if="headerStore.error" rounded class="bg-red-1 text-red-9 q-mb-md">
      {{ headerStore.error }}
    </q-banner>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center q-mb-sm">
              <div class="col text-subtitle1 text-weight-bold">Headers</div>
              <q-btn flat dense color="primary" icon="add" label="New" @click="createHeader" />
            </div>
            <q-list separator>
              <q-item
                v-for="header in headerStore.headers"
                :key="header.id"
                clickable
                :active="header.id === selectedId"
                active-class="bg-blue-1"
                @click="selectHeader(header.id)"
              >
                <q-item-section>
                  <q-item-label>{{ header.name }}</q-item-label>
                  <q-item-label caption>{{ kindLabel(header.kind) }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6" v-if="draft">
        <q-card flat bordered>
          <q-card-section>
            <div class="row q-col-gutter-sm q-mb-md items-end">
              <div class="col">
                <q-input v-model="draftName" outlined dense label="Name" :disable="selectedHeader?.isSystem" />
              </div>
              <div class="col-auto">
                <q-btn outline color="primary" icon="title" label="Text" @click="addText" />
              </div>
              <div class="col-auto">
                <q-btn outline color="primary" icon="image" label="Logo" @click="addLogo" />
              </div>
              <div class="col-auto">
                <q-btn color="primary" label="Save" :loading="headerStore.isSaving" @click="save" />
              </div>
            </div>

            <div
              ref="canvasRef"
              class="header-canvas"
              :style="canvasStyle"
              @pointerdown.self="selectedElementId = null"
            >
              <div
                v-for="element in draft.elements"
                :key="element.id"
                class="header-element"
                :class="{ 'header-element--selected': element.id === selectedElementId }"
                :style="elementStyle(element)"
                @pointerdown.stop="startDrag($event, element, 'move')"
              >
                <span v-if="element.type === 'text'">{{ previewText(element.text) }}</span>
                <span v-else class="text-grey-7">Logo</span>
                <span
                  class="header-element__resize"
                  @pointerdown.stop="startDrag($event, element, 'resize')"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3" v-if="selectedElement">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold q-mb-md">Element</div>
            <q-select
              v-if="selectedElement.type === 'text'"
              :model-value="matchedField"
              :options="fieldOptions"
              outlined
              dense
              emit-value
              map-options
              clearable
              label="Insert field"
              class="q-mb-sm"
              @update:model-value="insertField"
            />
            <q-input
              v-if="selectedElement.type === 'text'"
              v-model="selectedElement.text"
              outlined
              dense
              type="textarea"
              autogrow
              label="Text"
              class="q-mb-sm"
            />
            <q-input v-model.number="selectedElement.fontSize" type="number" outlined dense label="Font size" class="q-mb-sm" />
            <q-select
              v-model="selectedElement.fontWeight"
              :options="[{ label: 'Regular', value: 'normal' }, { label: 'Bold', value: 'bold' }]"
              emit-value
              map-options
              outlined
              dense
              label="Weight"
              class="q-mb-sm"
            />
            <q-select
              v-model="selectedElement.align"
              :options="[{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }, { label: 'Right', value: 'right' }]"
              emit-value
              map-options
              outlined
              dense
              label="Align"
              class="q-mb-sm"
            />
            <q-input v-model="selectedElement.color" outlined dense label="Color" class="q-mb-sm" />
            <div class="row q-col-gutter-sm">
              <div class="col-6"><q-input v-model.number="selectedElement.x" type="number" outlined dense label="X" /></div>
              <div class="col-6"><q-input v-model.number="selectedElement.y" type="number" outlined dense label="Y" /></div>
              <div class="col-6"><q-input v-model.number="selectedElement.width" type="number" outlined dense label="Width" /></div>
              <div class="col-6"><q-input v-model.number="selectedElement.height" type="number" outlined dense label="Height" /></div>
            </div>
            <q-btn flat color="negative" class="q-mt-md" label="Remove element" @click="removeElement" />
            <q-btn
              v-if="selectedHeader && !selectedHeader.isSystem"
              flat
              color="negative"
              class="q-mt-sm"
              label="Delete header"
              @click="removeHeader"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useDocumentHeaderStore } from '@payroll/stores/document-header-store';
import {
  HEADER_FIELD_OPTIONS,
  emptyTextElement,
  resolveHeaderText,
  type DocumentHeaderCanvas,
  type DocumentHeaderElement,
} from '@payroll/utils/document-header';

const $q = useQuasar();
const headerStore = useDocumentHeaderStore();
const selectedId = ref<string | null>(null);
const draft = ref<DocumentHeaderCanvas | null>(null);
const draftName = ref('');
const selectedElementId = ref<string | null>(null);
const canvasRef = ref<HTMLElement | null>(null);

const fieldOptions = HEADER_FIELD_OPTIONS.map((option) => ({
  label: option.label,
  value: option.token,
}));

const selectedHeader = computed(() => headerStore.headers.find((header) => header.id === selectedId.value) ?? null);
const selectedElement = computed(() => draft.value?.elements.find((element) => element.id === selectedElementId.value) ?? null);
const matchedField = computed(() => selectedElement.value?.text ?? null);

const canvasStyle = computed(() => {
  if (!draft.value) return {};
  return {
    width: '100%',
    aspectRatio: `${draft.value.width} / ${draft.value.height}`,
    background: draft.value.background,
  };
});

function kindLabel(kind: string): string {
  if (kind === 'company') return 'Default for payroll reports';
  if (kind === 'government') return 'Default for government reports';
  return 'Custom';
}

function previewText(text: string): string {
  return resolveHeaderText(text, headerStore.fields, { title: 'Report title', period: 'Period' }) || 'Text';
}

function elementStyle(element: DocumentHeaderElement): Record<string, string> {
  if (!draft.value) return {};
  return {
    left: `${(element.x / draft.value.width) * 100}%`,
    top: `${(element.y / draft.value.height) * 100}%`,
    width: `${(element.width / draft.value.width) * 100}%`,
    height: `${(element.height / draft.value.height) * 100}%`,
    fontSize: `${element.fontSize * 0.7}px`,
    fontWeight: element.fontWeight,
    textAlign: element.align,
    color: element.color,
  };
}

function selectHeader(id: string) {
  selectedId.value = id;
  const header = headerStore.headers.find((item) => item.id === id);
  if (!header) return;
  draft.value = JSON.parse(JSON.stringify(header.canvas)) as DocumentHeaderCanvas;
  draftName.value = header.name;
  selectedElementId.value = draft.value.elements[0]?.id ?? null;
}

function scale(): number {
  if (!canvasRef.value || !draft.value) return 1;
  return canvasRef.value.clientWidth / draft.value.width;
}

function startDrag(event: PointerEvent, element: DocumentHeaderElement, mode: 'move' | 'resize') {
  if (!draft.value) return;
  selectedElementId.value = element.id;
  const ratio = scale();
  const startX = event.clientX;
  const startY = event.clientY;
  const origin = { x: element.x, y: element.y, width: element.width, height: element.height };

  function move(next: PointerEvent) {
    const dx = (next.clientX - startX) / ratio;
    const dy = (next.clientY - startY) / ratio;
    if (mode === 'move') {
      element.x = Math.max(0, Math.round(origin.x + dx));
      element.y = Math.max(0, Math.round(origin.y + dy));
      return;
    }
    element.width = Math.max(24, Math.round(origin.width + dx));
    element.height = Math.max(16, Math.round(origin.height + dy));
  }

  function stop() {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', stop);
  }

  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', stop);
}

function addText() {
  if (!draft.value) return;
  const element = emptyTextElement();
  draft.value.elements.push(element);
  selectedElementId.value = element.id;
}

function addLogo() {
  if (!draft.value) return;
  const element = emptyTextElement({
    type: 'image',
    field: 'company.logo',
    text: '',
    width: 84,
    height: 84,
  });
  draft.value.elements.push(element);
  selectedElementId.value = element.id;
}

function insertField(token: string | null) {
  if (!selectedElement.value || !token) return;
  const current = selectedElement.value.text.trim();
  selectedElement.value.text = current ? `${current} ${token}` : token;
}

function removeElement() {
  if (!draft.value || !selectedElementId.value) return;
  draft.value.elements = draft.value.elements.filter((element) => element.id !== selectedElementId.value);
  selectedElementId.value = draft.value.elements[0]?.id ?? null;
}

function save() {
  if (!selectedHeader.value || !draft.value) return;
  void headerStore.saveHeader(selectedHeader.value, draft.value, draftName.value.trim() || selectedHeader.value.name)
    .then((ok) => {
      $q.notify({
        type: ok ? 'positive' : 'negative',
        message: ok ? 'Document header saved.' : headerStore.error || 'Failed to save the header.',
      });
    });
}

function createHeader() {
  const canvas = JSON.parse(JSON.stringify(headerStore.headers.find((header) => header.kind === 'company')?.canvas
    ?? { width: 980, height: 120, background: '#ffffff', elements: [] })) as DocumentHeaderCanvas;
  void headerStore.createHeader('Custom header', canvas).then((created) => {
    if (created) {
      selectHeader(created.id);
    }
  });
}

function removeHeader() {
  if (!selectedHeader.value || selectedHeader.value.isSystem) return;
  void headerStore.deleteHeader(selectedHeader.value).then((ok) => {
    if (ok) {
      selectedId.value = headerStore.headers[0]?.id ?? null;
      if (selectedId.value) selectHeader(selectedId.value);
    }
  });
}

watch(() => headerStore.headers, (headers) => {
  if (!selectedId.value && headers[0]) {
    selectHeader(headers[0].id);
  }
});

onMounted(() => {
  void headerStore.fetchHeaders().then(() => {
    if (headerStore.headers[0]) {
      selectHeader(headerStore.headers[0].id);
    }
  });
});
</script>

<style scoped>
.header-canvas {
  position: relative;
  border: 1px solid #d0d0d0;
  overflow: hidden;
  min-height: 120px;
}

.header-element {
  position: absolute;
  border: 1px dashed transparent;
  overflow: hidden;
  cursor: move;
  line-height: 1.2;
  padding: 2px;
  box-sizing: border-box;
}

.header-element--selected {
  border-color: #1976d2;
  background: rgba(25, 118, 210, 0.06);
}

.header-element__resize {
  display: none;
  position: absolute;
  right: 0;
  bottom: 0;
  width: 10px;
  height: 10px;
  background: #1976d2;
  cursor: nwse-resize;
}

.header-element--selected .header-element__resize {
  display: block;
}
</style>

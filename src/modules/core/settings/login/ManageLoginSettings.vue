<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="login-settings-card">
      <q-card-section>
        <div class="text-h6" data-onboarding="admin-settings">Login</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          People can sign in with their username or their email address. Choose how new employee
          usernames are generated when accounts are created.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-inner-loading :showing="store.isLoading">
          <q-spinner color="primary" size="32px" />
        </q-inner-loading>

        <q-form class="q-gutter-md" @submit.prevent="save">
          <div class="text-subtitle2">Sign-in</div>
          <q-select
            v-model="form.two_factor_policy"
            :options="twoFactorPolicyOptions"
            label="Authenticator 2FA policy"
            outlined
            emit-value
            map-options
            :disable="store.isLoading || store.isSaving"
          />
          <q-toggle
            v-model="form.passkeys_enabled"
            label="Allow passkey sign-in"
            :disable="store.isLoading || store.isSaving"
          />

          <q-separator />

          <div class="text-subtitle2">Username rules</div>
          <div class="text-body2 text-grey-7">
            Check the patterns to try, then drag to set priority. The first checked pattern is used
            when that username is available.
          </div>

          <div class="pattern-list">
            <div
              v-for="(row, index) in form.patternRows"
              :key="row.value"
              class="pattern-row"
              :class="{
                'pattern-row--dragging': dragIndex === index,
                'pattern-row--over': dragOverIndex === index && dragIndex !== index,
                'pattern-row--disabled': !row.enabled,
              }"
              @dragover.prevent="onDragOver(index)"
              @drop.prevent="onDrop(index)"
              @dragleave="onDragLeave(index)"
            >
              <q-icon
                name="drag_indicator"
                class="pattern-row__handle"
                :class="{ 'text-grey-5': store.isLoading || store.isSaving }"
                draggable="true"
                @dragstart="onDragStart(index, $event)"
                @dragend="onDragEnd"
              />
              <q-checkbox
                v-model="row.enabled"
                :disable="store.isLoading || store.isSaving || isLastEnabled(row)"
                :label="patternTitle(row.value)"
                class="pattern-row__check"
                @update:model-value="onTogglePattern(row)"
              />
              <div class="pattern-row__meta">
                <q-badge v-if="row.enabled" color="primary" outline>
                  {{ enabledRank(row.value) }}
                </q-badge>
                <span class="text-caption text-grey-7">{{ patternExample(row.value) }}</span>
              </div>
              <div class="pattern-row__move">
                <q-btn
                  flat
                  dense
                  round
                  icon="keyboard_arrow_up"
                  :disable="index === 0 || store.isLoading || store.isSaving"
                  @click="moveRow(index, -1)"
                >
                  <q-tooltip>Move up</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  round
                  icon="keyboard_arrow_down"
                  :disable="index === form.patternRows.length - 1 || store.isLoading || store.isSaving"
                  @click="moveRow(index, 1)"
                >
                  <q-tooltip>Move down</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>

          <q-select
            v-model="form.username_separator"
            :options="separatorOptions"
            label="Separator"
            outlined
            emit-value
            map-options
            :disable="store.isLoading || store.isSaving || !usesSeparator"
          />
          <q-toggle
            v-model="form.username_include_middle_initial"
            label="Also try with middle initial if the selected patterns are taken"
            :disable="store.isLoading || store.isSaving"
          />
          <q-input
            v-model="form.employee_login_domain"
            label="Login email domain"
            hint="Optional. New employee emails are username@this-domain. Leave blank to use the company email domain."
            outlined
            :disable="store.isLoading || store.isSaving"
          />

          <q-banner rounded class="bg-grey-2 text-grey-9">
            <div class="text-caption text-grey-7">Preview for John Michael Doe, in priority order</div>
            <ol class="preview-list">
              <li v-for="(candidate, index) in livePreviewCandidates" :key="`${candidate}-${index}`">
                {{ candidate }}
              </li>
            </ol>
            <div class="text-caption text-grey-7">
              Further collisions append 2, 3, and so on ({{ livePreviewCandidates[0] }}2).
            </div>
          </q-banner>

          <div class="row q-gutter-sm">
            <q-btn
              type="submit"
              color="primary"
              label="Save"
              :loading="store.isSaving"
              :disable="store.isLoading || enabledPatterns.length === 0"
            />
            <q-btn
              flat
              label="Reset"
              :disable="store.isLoading || store.isSaving"
              @click="resetForm"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import {
  useLoginSettingsStore,
  USERNAME_PATTERN_CATALOG,
  normalizeUsernamePatterns,
  type UsernamePattern,
  type UsernameSeparator,
  type TwoFactorPolicy,
} from '@core/stores/login-settings-store';

interface PatternRow {
  value: UsernamePattern;
  enabled: boolean;
}

defineProps<{
  title?: string;
}>();

const $q = useQuasar();
const store = useLoginSettingsStore();
const dragIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

const form = reactive({
  two_factor_policy: 'off' as TwoFactorPolicy,
  passkeys_enabled: true,
  patternRows: buildPatternRows(['first_last']),
  username_separator: '.' as UsernameSeparator,
  username_include_middle_initial: true,
  employee_login_domain: '',
});

const twoFactorPolicyOptions = [
  { label: 'Off — do not require 2FA', value: 'off' },
  { label: 'Optional — users may enable 2FA', value: 'optional' },
  { label: 'Required — enforce 2FA after password login', value: 'required' },
];

const separatorOptions = [
  { label: 'Dot (john.doe)', value: '.' },
  { label: 'Underscore (john_doe)', value: '_' },
  { label: 'Hyphen (john-doe)', value: '-' },
  { label: 'None (johndoe)', value: '' },
];

const enabledPatterns = computed(() =>
  form.patternRows.filter((row) => row.enabled).map((row) => row.value),
);

const usesSeparator = computed(() =>
  enabledPatterns.value.some((pattern) => pattern !== 'firstlast'),
);

function buildPatternRows(enabled: UsernamePattern[]): PatternRow[] {
  const selected = normalizeUsernamePatterns(enabled);
  const seen = new Set<UsernamePattern>(selected);
  return [
    ...selected.map((value) => ({ value, enabled: true })),
    ...USERNAME_PATTERN_CATALOG.filter((item) => !seen.has(item.value)).map((item) => ({
      value: item.value,
      enabled: false,
    })),
  ];
}

function patternTitle(value: UsernamePattern): string {
  return USERNAME_PATTERN_CATALOG.find((item) => item.value === value)?.title ?? value;
}

function patternExample(value: UsernamePattern): string {
  const item = USERNAME_PATTERN_CATALOG.find((entry) => entry.value === value);
  return item ? item.example(form.username_separator) : value;
}

function enabledRank(value: UsernamePattern): number {
  return enabledPatterns.value.indexOf(value) + 1;
}

function isLastEnabled(row: PatternRow): boolean {
  return row.enabled && enabledPatterns.value.length === 1;
}

function onTogglePattern(row: PatternRow) {
  if (!row.enabled && enabledPatterns.value.length === 0) {
    row.enabled = true;
  }
}

function reorder(from: number, to: number) {
  if (from === to || to < 0 || to >= form.patternRows.length) {
    return;
  }
  const row = form.patternRows.splice(from, 1)[0];
  if (!row) {
    return;
  }
  form.patternRows.splice(to, 0, row);
}

function moveRow(index: number, offset: number) {
  reorder(index, index + offset);
}

function onDragStart(index: number, event: DragEvent) {
  if (store.isLoading || store.isSaving) {
    event.preventDefault();
    return;
  }
  dragIndex.value = index;
  event.dataTransfer?.setData('text/plain', String(index));
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
}

function onDragOver(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) {
    return;
  }
  dragOverIndex.value = index;
}

function onDragLeave(index: number) {
  if (dragOverIndex.value === index) {
    dragOverIndex.value = null;
  }
}

function onDrop(index: number) {
  if (dragIndex.value !== null) {
    reorder(dragIndex.value, index);
  }
  onDragEnd();
}

function onDragEnd() {
  dragIndex.value = null;
  dragOverIndex.value = null;
}

function slugPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function joinParts(parts: Array<string | null>, separator: string): string {
  return parts.filter((part): part is string => Boolean(part)).join(separator);
}

function composePreview(pattern: UsernamePattern, includeMiddle: boolean): string {
  const first = slugPart('John');
  const last = slugPart('Doe');
  const middle = includeMiddle ? 'm' : null;
  const separator = form.username_separator;

  switch (pattern) {
    case 'last_first':
      return joinParts([last, middle, first], separator);
    case 'first_initial_last':
      return joinParts([first.slice(0, 1), middle, last], separator);
    case 'firstlast':
      return `${first}${middle ?? ''}${last}`;
    default:
      return joinParts([first, middle, last], separator);
  }
}

const livePreviewCandidates = computed(() => {
  const candidates: string[] = [];
  for (const pattern of enabledPatterns.value) {
    const value = composePreview(pattern, false);
    if (!candidates.includes(value)) {
      candidates.push(value);
    }
  }
  if (form.username_include_middle_initial) {
    for (const pattern of enabledPatterns.value) {
      const value = composePreview(pattern, true);
      if (!candidates.includes(value)) {
        candidates.push(value);
      }
    }
  }
  return candidates.length > 0 ? candidates : ['john.doe'];
});

function syncFormFromStore() {
  if (!store.settings) {
    return;
  }
  form.two_factor_policy = store.settings.two_factor_policy;
  form.passkeys_enabled = store.settings.passkeys_enabled;
  form.patternRows = buildPatternRows(store.settings.username_patterns);
  form.username_separator = store.settings.username_separator;
  form.username_include_middle_initial = store.settings.username_include_middle_initial;
  form.employee_login_domain = store.settings.employee_login_domain ?? '';
}

function resetForm() {
  syncFormFromStore();
}

async function save() {
  const patterns = enabledPatterns.value;
  if (patterns.length === 0) {
    $q.notify({
      type: 'negative',
      message: 'Select at least one username pattern.',
    });
    return;
  }

  try {
    await store.updateSettings({
      two_factor_policy: form.two_factor_policy,
      passkeys_enabled: form.passkeys_enabled,
      username_patterns: patterns,
      username_separator: form.username_separator,
      username_include_middle_initial: form.username_include_middle_initial,
      employee_login_domain: form.employee_login_domain.trim() || null,
    });
    syncFormFromStore();
    $q.notify({
      type: 'positive',
      message: 'Login settings saved.',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save login settings.',
    });
  }
}

watch(() => store.settings, syncFormFromStore, { immediate: true });

onMounted(async () => {
  const loaded = await store.fetchSettings();
  if (!loaded && store.error) {
    $q.notify({
      type: 'negative',
      message: store.error,
    });
  }
});
</script>

<style scoped>
.login-settings-card {
  max-width: 720px;
}

.pattern-list {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  overflow: hidden;
}

.pattern-row {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
}

.pattern-row:last-child {
  border-bottom: none;
}

.pattern-row--disabled {
  background: #fafafa;
}

.pattern-row--dragging {
  opacity: 0.55;
}

.pattern-row--over {
  box-shadow: inset 0 2px 0 var(--q-primary);
}

.pattern-row__handle {
  cursor: grab;
  font-size: 22px;
  color: #757575;
}

.pattern-row__check {
  min-width: 0;
}

.pattern-row__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.pattern-row__move {
  display: flex;
  flex-direction: column;
}

.preview-list {
  margin: 6px 0 8px;
  padding-left: 20px;
}

.preview-list li {
  line-height: 1.5;
}

.body--dark .pattern-row {
  background: transparent;
}

.body--dark .pattern-row--disabled {
  background: rgba(255, 255, 255, 0.04);
}

.body--dark .pattern-list {
  border-color: rgba(255, 255, 255, 0.16);
}

.body--dark .pattern-row {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}
</style>

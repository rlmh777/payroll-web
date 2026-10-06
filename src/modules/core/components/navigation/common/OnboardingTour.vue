<template>
  <Teleport to="body">
    <div
      v-if="onboarding.active && currentStep"
      class="onboarding-root"
      role="dialog"
      aria-modal="true"
      :aria-label="currentStep.title"
    >
      <div class="onboarding-mask" @click="onboarding.next()" />

      <div class="onboarding-spot" :class="{ 'onboarding-spot--ready': spotReady }" :style="spotStyle">
        <span class="onboarding-pulse" />
      </div>

      <div
        class="onboarding-card"
        :class="{
          'onboarding-card--ready': spotReady,
          'onboarding-card--left': currentStep.placement === 'left',
        }"
        :style="cardStyle"
      >
        <div class="onboarding-card__kicker">
          {{ onboarding.stepIndex + 1 }} of {{ onboarding.steps.length }}
        </div>
        <div class="onboarding-card__title">{{ currentStep.title }}</div>
        <p class="onboarding-card__body">{{ currentStep.body }}</p>
        <div class="onboarding-card__actions">
          <q-btn flat dense no-caps size="sm" label="Skip" color="grey-7" @click="onboarding.skip()" />
          <q-space />
          <q-btn
            v-if="onboarding.stepIndex > 0"
            flat
            dense
            no-caps
            size="sm"
            label="Back"
            @click="onboarding.back()"
          />
          <q-btn
            unelevated
            dense
            no-caps
            size="sm"
            color="primary"
            :label="onboarding.isLast ? (onboarding.isPageTour ? 'Got it' : 'Done') : 'Next'"
            @click="onboarding.next()"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../../stores/auth';
import { useMenuStore } from '../../../stores/menus';
import { pageTourForPath, useOnboardingStore, type OnboardingStep } from '../../../stores/onboarding';

const CARD_WIDTH = 300;
const CARD_GAP = 12;
const MAX_TARGET_RETRIES = 16;

const onboarding = useOnboardingStore();
const authStore = useAuthStore();
const menuStore = useMenuStore();
const route = useRoute();

const spotReady = ref(false);
const spot = ref({ top: 0, left: 0, width: 0, height: 0 });
let autoStartTimer: ReturnType<typeof setTimeout> | null = null;
let targetRetryTimer: ReturnType<typeof setTimeout> | null = null;
let targetRetries = 0;

const currentStep = computed(() => onboarding.currentStep);

const spotStyle = computed(() => ({
  top: `${spot.value.top}px`,
  left: `${spot.value.left}px`,
  width: `${spot.value.width}px`,
  height: `${spot.value.height}px`,
}));

const cardStyle = computed(() => {
  const step = currentStep.value;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const maxLeft = Math.max(12, viewportWidth - CARD_WIDTH - 12);
  let left = spot.value.left + spot.value.width / 2 - CARD_WIDTH / 2;
  let top = spot.value.top + spot.value.height + CARD_GAP;

  if (step?.placement === 'left') {
    left = spot.value.left - CARD_WIDTH - CARD_GAP;
    top = spot.value.top + spot.value.height / 2 - 70;
    if (left < 12) {
      left = Math.min(spot.value.left, maxLeft);
      top = spot.value.top + spot.value.height + CARD_GAP;
    }
  }

  left = Math.min(Math.max(12, left), maxLeft);

  if (top + 160 > viewportHeight) {
    top = Math.max(12, spot.value.top - 160);
  }

  return {
    top: `${top}px`,
    left: `${left}px`,
  };
});

function targetElement(step: OnboardingStep | undefined): HTMLElement | null {
  if (!step) {
    return null;
  }

  return document.querySelector<HTMLElement>(`[data-onboarding="${step.target}"]`);
}

function updateSpot() {
  const el = targetElement(currentStep.value);
  if (!el) {
    spotReady.value = false;
    return;
  }

  const rect = el.getBoundingClientRect();
  const maxWidth = Math.max(80, window.innerWidth - 24);
  const maxHeight = Math.max(80, Math.min(280, window.innerHeight - 24));
  spot.value = {
    top: Math.max(6, rect.top - 8),
    left: Math.max(6, rect.left - 8),
    width: Math.min(rect.width + 16, maxWidth),
    height: Math.min(rect.height + 16, maxHeight),
  };
  spotReady.value = true;
  onboarding.revealed = true;
}

function clearTargetRetry() {
  if (targetRetryTimer) {
    clearTimeout(targetRetryTimer);
    targetRetryTimer = null;
  }
}

function laterStepHasTarget(): boolean {
  return onboarding.steps.slice(onboarding.stepIndex + 1).some((step) => Boolean(targetElement(step)));
}

function tryUpdateSpot() {
  updateSpot();
  if (spotReady.value || !onboarding.active) {
    targetRetries = 0;
    clearTargetRetry();
    return;
  }

  const maxRetries = onboarding.isPageTour && laterStepHasTarget() ? 3 : MAX_TARGET_RETRIES;
  if (targetRetries >= maxRetries) {
    targetRetries = 0;
    clearTargetRetry();
    onboarding.skipMissingTarget();
    return;
  }

  targetRetries += 1;
  clearTargetRetry();
  targetRetryTimer = setTimeout(() => {
    tryUpdateSpot();
  }, 180);
}

function scheduleAutoStart() {
  if (autoStartTimer) {
    clearTimeout(autoStartTimer);
    autoStartTimer = null;
  }

  if (!authStore.isAuthenticated || route.path.startsWith('/login')) {
    return;
  }

  if (!menuStore.menuTree.length && !menuStore.launcher.length) {
    return;
  }

  autoStartTimer = setTimeout(() => {
    onboarding.maybeAutoStart();
    if (!onboarding.active) {
      onboarding.maybeAutoStartPage(route.path);
    }
    void nextTick().then(() => {
      tryUpdateSpot();
    });
  }, onboarding.isCompleted() ? 1100 : 700);
}

function onKeydown(event: KeyboardEvent) {
  if (!onboarding.active) {
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    void onboarding.skip();
  } else if (event.key === 'ArrowRight' || event.key === 'Enter') {
    event.preventDefault();
    onboarding.next();
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    onboarding.back();
  }
}

watch(
  () => [
    onboarding.active,
    onboarding.stepIndex,
    currentStep.value?.id,
  ],
  () => {
    targetRetries = 0;
    clearTargetRetry();
    if (!onboarding.active) {
      spotReady.value = false;
      return;
    }

    void nextTick().then(() => {
      tryUpdateSpot();
    });
  },
);

watch(
  () => [
    authStore.isAuthenticated,
    authStore.user?.id,
    authStore.user?.preferences?.onboardingEnabled,
    authStore.user?.preferences?.onboardingCompleted,
    menuStore.menuTree.length,
    route.path,
  ],
  () => {
    if (!authStore.isAuthenticated || route.path.startsWith('/login')) {
      onboarding.stop();
      return;
    }

    if (onboarding.active && onboarding.isPageTour) {
      const tour = pageTourForPath(route.path);
      if (!tour || tour.key !== onboarding.tourKey) {
        onboarding.stop();
      }
    }

    scheduleAutoStart();
  },
);

watch(
  () => onboarding.active,
  (isActive) => {
    if (!isActive && authStore.isAuthenticated && !route.path.startsWith('/login')) {
      scheduleAutoStart();
    }
  },
);

onMounted(() => {
  window.addEventListener('resize', updateSpot);
  window.addEventListener('scroll', updateSpot, true);
  window.addEventListener('keydown', onKeydown);
  scheduleAutoStart();
});

onUnmounted(() => {
  if (autoStartTimer) {
    clearTimeout(autoStartTimer);
  }
  clearTargetRetry();
  window.removeEventListener('resize', updateSpot);
  window.removeEventListener('scroll', updateSpot, true);
  window.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.onboarding-root {
  position: fixed;
  inset: 0;
  z-index: 7400;
  pointer-events: none;
}

.onboarding-mask {
  position: absolute;
  inset: 0;
  background: transparent;
  pointer-events: auto;
}

.onboarding-spot {
  position: absolute;
  border-radius: 12px;
  box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.42);
  outline: 2px solid rgba(96, 165, 250, 0.95);
  background: transparent;
  pointer-events: none;
  opacity: 0;
  transform: scale(0.92);
  transition:
    top 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    left 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    width 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.25s ease,
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.onboarding-spot--ready {
  opacity: 1;
  transform: scale(1);
}

.onboarding-pulse {
  position: absolute;
  inset: -6px;
  border-radius: 14px;
  border: 2px solid rgba(147, 197, 253, 0.7);
  animation: onboarding-pulse 1.6s ease-out infinite;
}

.onboarding-card {
  position: absolute;
  width: 300px;
  padding: 12px 14px 10px;
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.97) 0%, rgba(248, 250, 252, 0.96) 100%);
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 16px 36px rgba(15, 23, 42, 0.22);
  color: #0f172a;
  pointer-events: auto;
  opacity: 0;
  transform: translateY(8px);
  transition:
    top 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    left 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.25s ease,
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.onboarding-card--ready {
  opacity: 1;
  transform: translateY(0);
}

.onboarding-card__kicker {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.onboarding-card__title {
  margin-top: 2px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.25;
}

.onboarding-card__body {
  margin: 6px 0 10px;
  font-size: 12.5px;
  line-height: 1.4;
  color: #475569;
}

.onboarding-card__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

@keyframes onboarding-pulse {
  0% {
    opacity: 0.8;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.12);
  }
}
</style>

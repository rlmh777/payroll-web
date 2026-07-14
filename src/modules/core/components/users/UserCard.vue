<template>
  <q-card
    class="user-card"
    :class="{ 'user-card-selected': isSelected }"
    @click="$emit('click', user)"
  >
    <q-card-section class="user-info-section">
      <div class="row items-center">
        <q-avatar
          :style="{ backgroundColor: getAvatarColor(user.name) }"
          text-color="white"
          size="40px"
          class="q-mr-md"
          font-size="18px"
        >
          {{ getInitial(user.name) }}
        </q-avatar>
        <div class="col">
          <div class="text-subtitle2 text-weight-medium q-mb-xs">
            {{ user.name }}
          </div>
          <div class="text-caption text-grey-7">
            <span class="copyable-field-container">
              <span>{{ user.email }}</span>
              <q-icon
                name="content_copy"
                size="12px"
                class="copy-icon"
                @click.stop="copyToClipboard(user.email, 'Email')"
              />
            </span>
          </div>
          <div v-if="user.employee" class="text-caption text-grey-6 q-mt-xs">
            <q-icon name="badge" size="12px" />
            {{ user.employee.firstName }} {{ user.employee.lastName }}
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import type { User } from '../../stores/user-store';

interface Props {
  user: User;
  isSelected?: boolean;
}

withDefaults(defineProps<Props>(), {
  isSelected: false,
});

defineEmits<{
  click: [user: User];
}>();

const $q = useQuasar();

const getInitial = (name: string | undefined | null): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    if (first && last && first[0] && last[0]) {
      return (first[0] + last[0]).toUpperCase();
    }
  }
  return name.charAt(0).toUpperCase();
};

const getAvatarColor = (name: string | undefined | null): string => {
  const colors: string[] = [
    '#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#c2185b',
    '#0097a7', '#5d4037', '#455a64', '#d32f2f', '#0288d1',
    '#00796b', '#8e24aa', '#e64a19', '#303f9f', '#c62828',
    '#558b2f', '#ef6c00', '#6a1b9a', '#00838f', '#ad1457',
    '#1565c0', '#2e7d32', '#e65100', '#4a148c', '#b71c1c',
  ];

  if (!name) return colors[0]!;

  const initial = name.charAt(0).toUpperCase();
  const charCode = initial.charCodeAt(0);
  const colorIndex = charCode % colors.length;
  return colors[colorIndex]!;
};

const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    $q.notify({
      type: 'positive',
      message: `${label} copied to clipboard`,
      position: 'top',
      timeout: 2000,
    });
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to copy to clipboard',
      position: 'top',
      timeout: 2000,
    });
  }
};
</script>

<style scoped>
.user-card {
  position: relative;
  transition: box-shadow 0.3s ease;
  cursor: pointer;
  margin-bottom: 8px;
}

.user-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-card-selected {
  background-color: #f5f5f5;
  border-left: 3px solid var(--q-primary);
}

.user-info-section {
  padding: 12px;
}

.copyable-field-container {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

.copy-icon {
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
  color: var(--q-primary);
}

.copyable-field-container:hover .copy-icon {
  opacity: 1;
}

.copy-icon:hover {
  opacity: 1;
  transform: scale(1.1);
}
</style>


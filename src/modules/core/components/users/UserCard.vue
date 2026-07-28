<template>
  <q-card
    class="user-card"
    flat
    bordered
    :class="{ 'user-card--selected': isSelected }"
    @click="$emit('click', user)"
  >
    <q-card-section class="user-card__body">
      <q-avatar
        class="user-card__avatar"
        size="42px"
        font-size="15px"
        text-color="white"
        :style="{ backgroundColor: avatarColor }"
      >
        {{ initials }}
      </q-avatar>

      <div class="user-card__content">
        <div class="user-card__name" :title="user.name">
          {{ user.name }}
        </div>

        <div class="user-card__email copyable" :title="user.email">
          <span class="user-card__email-text">{{ user.email }}</span>
          <q-icon
            name="content_copy"
            size="12px"
            class="user-card__copy"
            @click.stop="copyToClipboard(user.email, 'Email')"
          >
            <q-tooltip>Copy email</q-tooltip>
          </q-icon>
        </div>

        <div v-if="roleNames" class="user-card__roles" :title="roleNames">
          <q-icon name="shield" size="12px" />
          <span>{{ roleNames }}</span>
        </div>

        <div v-if="employeeLabel" class="user-card__employee" :title="employeeLabel">
          <q-icon name="badge" size="12px" />
          <span>{{ employeeLabel }}</span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import type { User } from '../../stores/user-store';
import { getUserAvatarColor, getUserInitials } from './user-avatar';

interface Props {
  user: User;
  isSelected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
});

defineEmits<{
  click: [user: User];
}>();

const $q = useQuasar();

const initials = computed(() => getUserInitials(props.user.name));
const avatarColor = computed(() => getUserAvatarColor(props.user.name || props.user.email));

const employeeLabel = computed(() => {
  if (!props.user.employee) return '';
  const name = `${props.user.employee.firstName ?? ''} ${props.user.employee.lastName ?? ''}`.trim();
  const code = props.user.employee.code ? ` · ${props.user.employee.code}` : '';
  return `${name}${code}`.trim();
});

const roleNames = computed(() =>
  (props.user.rolesManyToMany || []).map((role) => role.name).join(', '),
);

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
  cursor: pointer;
  margin-bottom: 8px;
  border-radius: 10px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.user-card:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.user-card--selected {
  background: color-mix(in srgb, var(--q-primary) 8%, white);
  border-color: var(--q-primary);
}

.user-card__body {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
}

.user-card__avatar {
  flex-shrink: 0;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.user-card__content {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-card__name {
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.25;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-card__email {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  color: #6b7280;
  font-size: 0.75rem;
  line-height: 1.3;
}

.user-card__email-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-card__copy {
  flex-shrink: 0;
  opacity: 0;
  color: var(--q-primary);
  transition: opacity 0.15s ease, transform 0.15s ease;
  cursor: pointer;
}

.user-card:hover .user-card__copy,
.copyable:hover .user-card__copy {
  opacity: 1;
}

.user-card__copy:hover {
  transform: scale(1.1);
}

.user-card__employee {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  margin-top: 2px;
  color: #9ca3af;
  font-size: 0.72rem;
  line-height: 1.25;
}

.user-card__roles {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  margin-top: 2px;
  color: #6b7280;
  font-size: 0.72rem;
  line-height: 1.25;
}

.user-card__employee span,
.user-card__roles span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

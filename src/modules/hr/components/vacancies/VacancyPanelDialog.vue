<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <AppDialogCard modal>
      <AppDialogHeader>
        <div>
          <div class="text-h6">Interview panel</div>
          <div class="text-caption text-grey-7">{{ vacancy?.title }}</div>
        </div>
      </AppDialogHeader>
      <AppDialogBody>
        <div class="text-caption text-grey-7 q-mb-sm">
          Score sheet:
          <strong>{{ vacancy?.form_template?.name || 'None assigned' }}</strong>
        </div>
        <AppDialogForm>
          <div class="col-12 col-sm-5">
            <q-input v-model="invite.name" outlined dense label="Name">
              <template #prepend>
                <q-icon name="person" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-5">
            <q-input v-model="invite.email" outlined dense type="email" label="Email">
              <template #prepend>
                <q-icon name="email" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-2">
            <q-btn
              color="primary"
              class="full-width"
              :loading="store.isSaving"
              label="Invite"
              @click="sendInvite"
            />
          </div>
        </AppDialogForm>

        <q-list v-if="store.members.length" bordered separator class="q-mt-md rounded-borders">
          <q-item v-for="member in store.members" :key="member.id">
            <q-item-section>
              <q-item-label>{{ member.name }}</q-item-label>
              <q-item-label caption>{{ member.email }} · {{ member.status }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn flat dense no-caps color="primary" label="Resend" @click="resend(member)" />
              <q-btn flat dense no-caps color="negative" label="Remove" @click="revoke(member)" />
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else class="text-grey-7 q-mt-md">No panel members yet.</div>
      </AppDialogBody>
      <AppDialogActions>
        <q-btn v-close-popup flat label="Close" />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import { useVacancyPanelStore, type VacancyPanelMember } from '@hr/stores/vacancy-panel-store';
import type { Vacancy } from '@hr/stores/vacancy-store';

const props = defineProps<{
  modelValue: boolean;
  vacancy?: Vacancy | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const store = useVacancyPanelStore();
const $q = useQuasar();
const invite = reactive({ name: '', email: '' });

async function sendInvite() {
  if (!props.vacancy || !invite.name.trim() || !invite.email.trim()) {
    $q.notify({ type: 'negative', message: 'Name and email are required.' });
    return;
  }
  try {
    await store.invite(props.vacancy.id, invite.name.trim(), invite.email.trim());
    invite.name = '';
    invite.email = '';
    $q.notify({ type: 'positive', message: 'Invitation sent.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not invite panel member.',
    });
  }
}

async function resend(member: VacancyPanelMember) {
  if (!props.vacancy) {
    return;
  }
  try {
    await store.resend(props.vacancy.id, member.id);
    $q.notify({ type: 'positive', message: 'Invitation resent.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not resend invitation.',
    });
  }
}

function revoke(member: VacancyPanelMember) {
  if (!props.vacancy) {
    return;
  }
  $q.dialog({
    title: 'Remove panel member?',
    message: `${member.name} will no longer be able to score this vacancy.`,
    cancel: true,
    ok: { label: 'Remove', color: 'negative' },
  }).onOk(() => {
    void store.revoke(props.vacancy!.id, member.id).catch((error: unknown) => {
      $q.notify({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Could not remove panel member.',
      });
    });
  });
}

watch(
  () => [props.modelValue, props.vacancy?.id],
  () => {
    if (props.modelValue && props.vacancy) {
      void store.fetchMembers(props.vacancy.id);
    }
  },
);
</script>

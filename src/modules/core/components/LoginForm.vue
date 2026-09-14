<template>
  <q-form v-if="step === 'credentials'" @submit="onSubmit" class="q-gutter-md" style="width: 100%">
    <q-input
      outlined
      rounded
      v-model="username"
      label="Username or email"
      type="text"
      autocomplete="username webauthn"
      :rules="[(val) => !!val?.trim() || 'Username or email is required']"
    >
      <template v-slot:prepend>
        <q-icon name="person" />
      </template>
    </q-input>

    <q-input
      outlined
      rounded
      v-model="password"
      label="Password"
      :type="isPwd ? 'password' : 'text'"
      autocomplete="current-password"
      :rules="passwordRules"
    >
      <template v-slot:prepend>
        <q-icon name="lock" />
      </template>
      <template v-slot:append>
        <q-icon
          :name="isPwd ? 'visibility_off' : 'visibility'"
          class="cursor-pointer"
          @click="isPwd = !isPwd"
        />
      </template>
    </q-input>

    <q-checkbox
      v-model="rememberUsername"
      dense
      label="Remember username"
    />

    <div class="column q-gutter-sm">
      <q-btn
        outlined
        label="Login"
        type="submit"
        color="primary"
        class="full-width"
        :loading="loading"
      />
      <q-btn
        v-if="passkeysSupported"
        flat
        label="Sign in with passkey"
        color="primary"
        class="full-width"
        icon="fingerprint"
        :loading="passkeyLoading"
        :disable="loading"
        @click="onPasskeyLogin"
      />
    </div>
  </q-form>

  <q-form
    v-else-if="step === 'verify'"
    @submit="onVerifyTwoFactor"
    class="q-gutter-md"
    style="width: 100%"
  >
    <div class="text-body2 text-grey-8">
      Enter the 6-digit code from your authenticator app, or a recovery code.
    </div>
    <q-input
      outlined
      rounded
      v-model="totpCode"
      label="Authentication code"
      autocomplete="one-time-code"
      :rules="[(val) => !!val?.trim() || 'Code is required']"
    >
      <template v-slot:prepend>
        <q-icon name="phonelink_lock" />
      </template>
    </q-input>
    <div class="column q-gutter-sm">
      <q-btn
        outlined
        label="Verify"
        type="submit"
        color="primary"
        class="full-width"
        :loading="loading"
      />
      <q-btn flat label="Back to login" color="primary" class="full-width" :disable="loading" @click="resetChallenge" />
    </div>
  </q-form>

  <div v-else-if="step === 'setup'" class="column q-gutter-md" style="width: 100%">
    <div class="text-body2 text-grey-8">
      Your organization requires authenticator 2FA. Scan the QR code with an app like Google Authenticator or Authy, then enter the code it shows.
    </div>
    <div v-if="setupOptions?.qr_svg" class="flex flex-center">
      <img :src="setupOptions.qr_svg" alt="Authenticator QR code" style="width: 220px; height: 220px" />
    </div>
    <div v-if="setupOptions?.secret" class="text-caption text-center text-grey-7">
      Or enter this key manually: <strong class="text-weight-medium">{{ setupOptions.secret }}</strong>
    </div>
    <q-form @submit="onConfirmSetup" class="q-gutter-md">
      <q-input
        outlined
        rounded
        v-model="totpCode"
        label="Authentication code"
        autocomplete="one-time-code"
        :rules="[(val) => !!val?.trim() || 'Code is required']"
      >
        <template v-slot:prepend>
          <q-icon name="phonelink_lock" />
        </template>
      </q-input>
      <div class="column q-gutter-sm">
        <q-btn
          outlined
          label="Confirm and continue"
          type="submit"
          color="primary"
          class="full-width"
          :loading="loading"
        />
        <q-btn flat label="Back to login" color="primary" class="full-width" :disable="loading" @click="resetChallenge" />
      </div>
    </q-form>
  </div>

  <div v-else-if="step === 'recovery'" class="column q-gutter-md" style="width: 100%">
    <div class="text-body2 text-grey-8">
      Save these recovery codes somewhere safe. Each code can be used once if you lose access to your authenticator.
    </div>
    <q-list bordered dense class="rounded-borders">
      <q-item v-for="code in recoveryCodes" :key="code">
        <q-item-section class="text-mono">{{ code }}</q-item-section>
      </q-item>
    </q-list>
    <q-btn
      outlined
      label="I saved my codes — continue"
      color="primary"
      class="full-width"
      @click="finishAfterRecovery"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '@core/stores/auth';
import { useMenuStore } from '@core/stores/menus';
import { useOrganizationStore } from 'src/stores/organization-store';
import { useRouter } from 'vue-router';
import { Notify } from 'quasar';
import {
  getRememberedUsername,
  isRememberUsernameEnabled,
  setRememberUsername,
} from '@core/utils/remember-username';

type LoginStep = 'credentials' | 'verify' | 'setup' | 'recovery';

interface LoginTwoFactorSetup {
  secret: string;
  otpauth_url: string;
  qr_svg: string;
}

const username = ref('');
const password = ref('');
const rememberUsername = ref(false);
const loading = ref(false);
const passkeyLoading = ref(false);
const isPwd = ref(true);
const step = ref<LoginStep>('credentials');
const challengeKey = ref('');
const totpCode = ref('');
const setupOptions = ref<LoginTwoFactorSetup | null>(null);
const recoveryCodes = ref<string[]>([]);

const authStore = useAuthStore();
const menuStore = useMenuStore();
const organizationStore = useOrganizationStore();
const router = useRouter();

const passkeysSupported = computed(
  () => typeof window !== 'undefined' && typeof window.PublicKeyCredential !== 'undefined',
);

const passwordRules = computed(() => [
  (val: string) => !!val || 'Password is required',
]);

onMounted(() => {
  rememberUsername.value = isRememberUsernameEnabled();
  username.value = getRememberedUsername();
});

function resetChallenge() {
  step.value = 'credentials';
  challengeKey.value = '';
  totpCode.value = '';
  setupOptions.value = null;
  recoveryCodes.value = [];
}

async function afterLoginSuccess() {
  setRememberUsername(rememberUsername.value, username.value);
  await organizationStore.fetchOrganizations();
  await menuStore.fetchMenus();

  const preferred = authStore.user?.preferences?.defaultModule ?? 'payroll';
  menuStore.setActiveModule(preferred);
  const target = menuStore.enabledModules.find((module) => module.code === preferred);
  void router.push(target?.default_route || '/');
}

async function startForcedSetup(key: string) {
  challengeKey.value = key;
  loading.value = true;
  try {
    const options = await authStore.beginTwoFactorSetup(key);
    if (!options) {
      resetChallenge();
      return;
    }
    setupOptions.value = options;
    totpCode.value = '';
    step.value = 'setup';
  } finally {
    loading.value = false;
  }
}

async function onSubmit() {
  loading.value = true;
  try {
    const result = await authStore.login(username.value.trim(), password.value);
    if (result.type === 'success') {
      await afterLoginSuccess();
      return;
    }
    if (result.type === 'two_factor') {
      challengeKey.value = result.challengeKey;
      totpCode.value = '';
      step.value = 'verify';
      return;
    }
    if (result.type === 'two_factor_setup') {
      await startForcedSetup(result.challengeKey);
    }
  } catch (error) {
    console.error('Navigation error:', error);
  } finally {
    loading.value = false;
  }
}

async function onVerifyTwoFactor() {
  loading.value = true;
  try {
    const success = await authStore.verifyTwoFactor(challengeKey.value, totpCode.value.trim());
    if (success) {
      await afterLoginSuccess();
    }
  } catch (error) {
    console.error('Two-factor verify error:', error);
  } finally {
    loading.value = false;
  }
}

async function onConfirmSetup() {
  loading.value = true;
  try {
    const result = await authStore.confirmTwoFactorSetup(challengeKey.value, totpCode.value.trim());
    if (!result) {
      return;
    }
    recoveryCodes.value = result.recoveryCodes;
    if (recoveryCodes.value.length > 0) {
      step.value = 'recovery';
      return;
    }
    await afterLoginSuccess();
  } catch (error) {
    console.error('Two-factor setup error:', error);
  } finally {
    loading.value = false;
  }
}

async function finishAfterRecovery() {
  recoveryCodes.value = [];
  await afterLoginSuccess();
}

async function onPasskeyLogin() {
  if (!username.value.trim()) {
    Notify.create({
      type: 'warning',
      message: 'Enter your username or email first, then use your passkey.',
      position: 'top',
    });
    return;
  }

  passkeyLoading.value = true;
  try {
    const success = await authStore.loginWithPasskey(username.value.trim());
    if (success) {
      await afterLoginSuccess();
    }
  } catch (error) {
    console.error('Passkey login error:', error);
  } finally {
    passkeyLoading.value = false;
  }
}
</script>

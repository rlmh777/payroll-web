<template>
  <div v-if="step === 'accounts'" class="login-accounts" style="width: 100%">
    <div class="text-h6 q-mb-sm">Choose an account</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Select a saved account to continue, or use another account.
    </div>
    <q-list class="login-accounts__list">
      <q-item
        v-for="account in accounts"
        :key="account.id"
        clickable
        v-ripple
        class="login-accounts__item"
        :disable="busy"
        @click="selectAccount(account)"
      >
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white" size="40px">
            <img v-if="account.pictureUrl" :src="account.pictureUrl" alt="" />
            <span v-else>{{ accountInitials(account) }}</span>
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">{{ account.name }}</q-item-label>
          <q-item-label caption>{{ accountSecondaryLabel(account) }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="row items-center no-wrap">
            <q-icon
              v-if="accountHasPasskey(account)"
              name="fingerprint"
              color="grey-7"
              size="20px"
              class="q-mr-xs"
            >
              <q-tooltip>Passkey available</q-tooltip>
            </q-icon>
            <q-spinner v-if="proceedingId === account.id" color="primary" size="20px" class="q-mr-xs" />
            <q-btn
              flat
              round
              dense
              icon="close"
              color="grey-7"
              :disable="busy"
              aria-label="Remove account"
              @click.stop="confirmRemove(account)"
            >
              <q-tooltip>Remove from this device</q-tooltip>
            </q-btn>
          </div>
        </q-item-section>
      </q-item>
      <q-item
        clickable
        v-ripple
        class="login-accounts__item login-accounts__item--other"
        :disable="busy"
        @click="useAnotherAccount"
      >
        <q-item-section avatar>
          <q-avatar color="grey-3" text-color="grey-8" icon="person_add" size="40px" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Use another account</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>

  <q-form
    v-else-if="step === 'password'"
    @submit="onSubmit"
    class="q-gutter-md"
    style="width: 100%"
  >
    <div v-if="selectedAccount" class="login-selected">
      <q-avatar color="primary" text-color="white" size="48px">
        <img v-if="selectedAccount.pictureUrl" :src="selectedAccount.pictureUrl" alt="" />
        <span v-else>{{ accountInitials(selectedAccount) }}</span>
      </q-avatar>
      <div class="login-selected__copy">
        <div class="text-subtitle1 text-weight-medium">{{ selectedAccount.name }}</div>
        <div class="text-caption text-grey-7">{{ accountSecondaryLabel(selectedAccount) }}</div>
      </div>
    </div>

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

    <div class="column q-gutter-sm">
      <q-btn
        outlined
        label="Next"
        type="submit"
        color="primary"
        class="full-width"
        :loading="loading"
      />
      <q-btn
        v-if="passkeysSupported && selectedAccount && accountHasPasskey(selectedAccount)"
        flat
        label="Use passkey"
        color="primary"
        class="full-width"
        icon="fingerprint"
        :loading="passkeyLoading"
        :disable="loading"
        @click="onPasskeyLogin(true)"
      />
      <q-btn
        flat
        label="Switch account"
        color="primary"
        class="full-width"
        :disable="busy"
        @click="backToChooser"
      />
    </div>
  </q-form>

  <q-form v-else-if="step === 'credentials'" @submit="onSubmit" class="q-gutter-md" style="width: 100%">
    <div v-if="accounts.length > 0" class="text-caption text-grey-7">
      Sign in with a different account. It will be saved on this device for next time.
    </div>
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
        @click="onPasskeyLogin(false)"
      />
      <q-btn
        v-if="accounts.length > 0"
        flat
        label="Back to accounts"
        color="primary"
        class="full-width"
        :disable="busy"
        @click="backToChooser"
      />
      <div v-if="passkeysSupported" class="text-caption text-grey-7 text-center">
        Create a passkey after you sign in with your password.
      </div>
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
import { useAuthStore, type PasskeyCeremony } from '@core/stores/auth';
import { useMenuStore } from '@core/stores/menus';
import { useOrganizationStore } from 'src/stores/organization-store';
import { useRouter } from 'vue-router';
import { Dialog, Notify } from 'quasar';
import {
  accountInitials,
  accountSecondaryLabel,
  listRememberedAccounts,
  removeRememberedAccount,
  updateRememberedAccountPasskeys,
  upsertRememberedAccount,
  type RememberedAccount,
} from '@core/utils/remembered-accounts';

type LoginStep = 'accounts' | 'credentials' | 'password' | 'verify' | 'setup' | 'recovery';

interface LoginTwoFactorSetup {
  secret: string;
  otpauth_url: string;
  qr_svg: string;
}

const username = ref('');
const password = ref('');
const loading = ref(false);
const passkeyLoading = ref(false);
const isPwd = ref(true);
const step = ref<LoginStep>('credentials');
const challengeKey = ref('');
const totpCode = ref('');
const setupOptions = ref<LoginTwoFactorSetup | null>(null);
const recoveryCodes = ref<string[]>([]);
const pendingOfferPasskey = ref(true);
const accounts = ref<RememberedAccount[]>([]);
const selectedAccount = ref<RememberedAccount | null>(null);
const proceedingId = ref<string | null>(null);
const passkeyPrep = ref<Record<string, PasskeyCeremony>>({});
const passkeyPrepTasks = new Map<string, Promise<PasskeyCeremony>>();

const authStore = useAuthStore();
const menuStore = useMenuStore();
const organizationStore = useOrganizationStore();
const router = useRouter();

const passkeysSupported = computed(
  () => typeof window !== 'undefined' && typeof window.PublicKeyCredential !== 'undefined',
);

const busy = computed(() => loading.value || passkeyLoading.value);

const passwordRules = computed(() => [
  (val: string) => !!val || 'Password is required',
]);

onMounted(() => {
  refreshAccounts();
  if (accounts.value.length > 0) {
    step.value = 'accounts';
  }
  if (passkeysSupported.value) {
    void authStore.preloadPasskeyLibrary();
    prefetchAccountPasskeys();
  }
});

function refreshAccounts() {
  accounts.value = listRememberedAccounts();
}

function accountIdentity(account: RememberedAccount): string {
  return (account.username || account.email).trim();
}

function accountHasPasskey(account: RememberedAccount): boolean {
  return passkeyPrep.value[account.id]?.hasPasskeys ?? account.hasPasskeys;
}

function invalidatePasskeyPrep(accountId: string) {
  passkeyPrepTasks.delete(accountId);
  const next = { ...passkeyPrep.value };
  delete next[accountId];
  passkeyPrep.value = next;
}

async function preparePasskey(account: RememberedAccount): Promise<PasskeyCeremony> {
  const existing = passkeyPrepTasks.get(account.id);
  if (existing) {
    return existing;
  }
  const task = authStore.fetchPasskeyOptions(accountIdentity(account)).then((ceremony) => {
    passkeyPrep.value = { ...passkeyPrep.value, [account.id]: ceremony };
    updateRememberedAccountPasskeys(account.id, ceremony.hasPasskeys);
    refreshAccounts();
    return ceremony;
  });
  passkeyPrepTasks.set(account.id, task);
  try {
    return await task;
  } catch (error) {
    passkeyPrepTasks.delete(account.id);
    throw error;
  }
}

function prefetchAccountPasskeys() {
  for (const account of accounts.value) {
    void preparePasskey(account).catch((error) => {
      console.error('Passkey options prefetch error:', error);
    });
  }
}

function rememberCurrentUser(overrides: { hasPasskeys?: boolean } = {}) {
  const user = authStore.user;
  if (!user) {
    return;
  }
  upsertRememberedAccount({
    id: user.id,
    name: user.name,
    username: user.username ?? user.email,
    email: user.email,
    pictureUrl: user.pictureUrl ?? null,
    hasPasskeys: overrides.hasPasskeys ?? Boolean(user.hasPasskeys),
  });
  refreshAccounts();
}

function showChooserOrCredentials() {
  selectedAccount.value = null;
  proceedingId.value = null;
  password.value = '';
  refreshAccounts();
  step.value = accounts.value.length > 0 ? 'accounts' : 'credentials';
}

function resetChallenge() {
  challengeKey.value = '';
  totpCode.value = '';
  setupOptions.value = null;
  recoveryCodes.value = [];
  pendingOfferPasskey.value = true;
  showChooserOrCredentials();
}

function backToChooser() {
  username.value = '';
  showChooserOrCredentials();
}

function useAnotherAccount() {
  selectedAccount.value = null;
  username.value = '';
  password.value = '';
  step.value = 'credentials';
}

function confirmRemove(account: RememberedAccount) {
  Dialog.create({
    title: 'Remove account?',
    message: `Remove ${account.name} from this device? You can still sign in later with your username and password.`,
    cancel: { label: 'Cancel', flat: true },
    ok: { label: 'Remove', color: 'negative' },
  }).onOk(() => {
    removeRememberedAccount(account.id);
    if (selectedAccount.value?.id === account.id) {
      selectedAccount.value = null;
    }
    refreshAccounts();
    if (accounts.value.length === 0 && (step.value === 'accounts' || step.value === 'password')) {
      username.value = '';
      password.value = '';
      step.value = 'credentials';
    }
  });
}

function promptCreatePasskey(): Promise<boolean> {
  return new Promise((resolve) => {
    Dialog.create({
      title: 'Create a passkey?',
      message:
        'Save a passkey on this device so next time you can sign in with Face ID, Touch ID, or Windows Hello instead of a password.',
      cancel: { label: 'Not now', flat: true },
      ok: { label: 'Create passkey', color: 'primary' },
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false));
  });
}

async function afterLoginSuccess(options: { offerPasskey?: boolean } = {}) {
  rememberCurrentUser();
  if (options.offerPasskey && passkeysSupported.value) {
    const shouldCreate = await promptCreatePasskey();
    if (shouldCreate) {
      const created = await authStore.registerCurrentDevicePasskey();
      if (created) {
        rememberCurrentUser({ hasPasskeys: true });
      }
    }
  }

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

function loginIdentity(): string {
  return (
    selectedAccount.value?.username
    || selectedAccount.value?.email
    || username.value
  ).trim();
}

function showPasswordForAccount(account: RememberedAccount) {
  selectedAccount.value = account;
  username.value = account.username || account.email;
  password.value = '';
  step.value = 'password';
  if (passkeysSupported.value) {
    void preparePasskey(account).catch((error) => {
      console.error('Passkey options prefetch error:', error);
    });
  }
}

function selectAccount(account: RememberedAccount) {
  if (busy.value) {
    return;
  }
  selectedAccount.value = account;
  username.value = account.username || account.email;
  if (!passkeysSupported.value) {
    showPasswordForAccount(account);
    return;
  }
  const prepared = passkeyPrep.value[account.id];
  if (prepared && !prepared.hasPasskeys && !account.hasPasskeys) {
    showPasswordForAccount(account);
    return;
  }
  void promptPasskey(account, prepared?.hasPasskeys ? prepared : undefined);
}

async function promptPasskey(account: RememberedAccount, prepared?: PasskeyCeremony) {
  proceedingId.value = account.id;
  passkeyLoading.value = true;
  try {
    const ceremony = prepared?.hasPasskeys ? prepared : await preparePasskey(account);
    if (!ceremony.hasPasskeys) {
      showPasswordForAccount({ ...account, hasPasskeys: false });
      return;
    }
    const result = await authStore.completePasskeyLogin(ceremony.options, ceremony.challengeKey, {
      quiet: true,
    });
    invalidatePasskeyPrep(account.id);
    if (result === 'success') {
      updateRememberedAccountPasskeys(account.id, true);
      await afterLoginSuccess();
      return;
    }
    if (result === 'no_passkey') {
      updateRememberedAccountPasskeys(account.id, false);
      refreshAccounts();
      showPasswordForAccount({ ...account, hasPasskeys: false });
      return;
    }
    showPasswordForAccount(account);
  } catch (error) {
    console.error('Passkey login error:', error);
    invalidatePasskeyPrep(account.id);
    showPasswordForAccount(account);
  } finally {
    passkeyLoading.value = false;
    proceedingId.value = null;
  }
}

async function onSubmit() {
  loading.value = true;
  try {
    const result = await authStore.login(loginIdentity(), password.value);
    if (result.type === 'success') {
      await afterLoginSuccess({ offerPasskey: !result.hasPasskeys });
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
    const result = await authStore.verifyTwoFactor(challengeKey.value, totpCode.value.trim());
    if (result.ok) {
      await afterLoginSuccess({ offerPasskey: !result.hasPasskeys });
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
      pendingOfferPasskey.value = !result.hasPasskeys;
      step.value = 'recovery';
      return;
    }
    await afterLoginSuccess({ offerPasskey: !result.hasPasskeys });
  } catch (error) {
    console.error('Two-factor setup error:', error);
  } finally {
    loading.value = false;
  }
}

async function finishAfterRecovery() {
  recoveryCodes.value = [];
  await afterLoginSuccess({ offerPasskey: pendingOfferPasskey.value });
}

async function onPasskeyLogin(fromSelectedAccount: boolean) {
  const identity = loginIdentity();
  if (!identity) {
    Notify.create({
      type: 'warning',
      message: 'Enter your username or email first, then use your passkey.',
      position: 'top',
    });
    return;
  }

  if (fromSelectedAccount && selectedAccount.value) {
    const prepared = passkeyPrep.value[selectedAccount.value.id];
    await promptPasskey(selectedAccount.value, prepared);
    return;
  }

  passkeyLoading.value = true;
  try {
    const result = await authStore.loginWithPasskey(identity);
    if (result === 'success') {
      await afterLoginSuccess();
    }
  } catch (error) {
    console.error('Passkey login error:', error);
  } finally {
    passkeyLoading.value = false;
  }
}
</script>

<style scoped>
.login-accounts__list {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  overflow: hidden;
}

.login-accounts__item {
  min-height: 64px;
}

.login-accounts__item--other {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.login-selected {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0 8px;
}
</style>

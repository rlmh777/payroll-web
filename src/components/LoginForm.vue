<template>
  <q-form @submit="onSubmit" class="q-gutter-md" style="width: 100%;">
    <q-input
      outlined
      rounded
      v-model="email"
      label="Email"
      type="email"
      :rules="[val => !!val || 'Email is required', isValidEmail]"
    >
      <template v-slot:prepend>
        <q-icon name="mail" />
      </template>
    </q-input>

    <q-input
      outlined
      rounded
      v-model="password"
      label="Password"
      :type="isPwd ? 'password' : 'text'"
      :rules="[val => !!val || 'Password is required']"
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

    <div>
      <q-btn
        outlined
        label="Login"
        type="submit"
        color="primary"
        class="full-width"
        :loading="loading"
      />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const loading = ref(false)
const isPwd = ref(true)
const authStore = useAuthStore()
const router = useRouter()

const isValidEmail = (val: string) => {
  const emailPattern = /^(?=[a-zA-Z0-9@._%+-]{6,254}$)[a-zA-Z0-9._%+-]{1,64}@(?:[a-zA-Z0-9-]{1,63}\.){1,8}[a-zA-Z]{2,63}$/
  return emailPattern.test(val) || 'Invalid email format'
}

async function onSubmit() {
  loading.value = true
  try {
    const success = await authStore.login(email.value, password.value)
    if (success) {
      void router.push('/')
    }
  } catch (error) {
    console.error('Navigation error:', error)
  } finally {
    loading.value = false
  }
}
</script> 
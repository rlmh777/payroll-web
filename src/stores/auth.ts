import { defineStore } from 'pinia';
import { ref } from 'vue';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

const API_URL = process.env.API_URL || 'http://localhost:3031/api';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null);
  const user = ref<User | null>(null);
  const isAuthenticated = ref(false);

  async function login(email: string, password: string) {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      token.value = data.token;
      user.value = data.user;
      isAuthenticated.value = true;

      // Store token in localStorage
      localStorage.setItem('auth_token', data.token);

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    isAuthenticated.value = false;
    localStorage.removeItem('auth_token');
  }

  function checkAuth() {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      token.value = storedToken;
      isAuthenticated.value = true;
      // TODO: Validate token with backend
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };
});

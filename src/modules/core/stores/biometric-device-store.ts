import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

export type BiometricProtocol = 'http_push' | 'isup' | 'agent';
export type BiometricDeviceStatus = 'online' | 'offline' | 'unknown';

export interface BiometricDevice {
  id: string;
  code: string;
  name: string;
  model: string;
  serialNumber: string | null;
  location: string | null;
  timezone: string;
  protocol: BiometricProtocol;
  heartbeatTimeoutSeconds: number;
  isActive: boolean;
  status: BiometricDeviceStatus;
  registeredAt: string | null;
  lastSeenAt: string | null;
  lastHeartbeatAt: string | null;
  lastEventAt: string | null;
  ipAddress: string | null;
  firmware: string | null;
  lastError: string | null;
  notes: string | null;
  authTokenSet: boolean;
  authToken?: string;
  pushUrl: string;
  heartbeatUrl: string;
  registerUrl: string;
}

export interface BiometricDevicePayload {
  code: string;
  name: string;
  model?: string | null;
  serialNumber?: string | null;
  location?: string | null;
  timezone?: string | null;
  protocol?: BiometricProtocol;
  heartbeatTimeoutSeconds?: number;
  isActive?: boolean;
  notes?: string | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export const useBiometricDeviceStore = defineStore('biometricDevices', {
  state: () => ({
    devices: [] as BiometricDevice[],
    isLoading: false,
    isSaving: false,
    error: null as string | null,
    lastIssuedToken: null as string | null,
  }),

  actions: {
    buildHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`;
      }
      return headers;
    },

    async fetchDevices() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/biometric-devices`, {
          headers: this.buildHeaders(),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to load biometric devices');
        }
        const body = await response.json();
        this.devices = Array.isArray(body.data) ? body.data : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load biometric devices';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async createDevice(payload: BiometricDevicePayload): Promise<BiometricDevice> {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/biometric-devices`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to create biometric device');
        }
        const device = body.data as BiometricDevice;
        this.lastIssuedToken = device.authToken ?? null;
        await this.fetchDevices();
        return device;
      } finally {
        this.isSaving = false;
      }
    },

    async updateDevice(id: string, payload: Partial<BiometricDevicePayload>): Promise<void> {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/biometric-devices/${id}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to update biometric device');
        }
        await this.fetchDevices();
      } finally {
        this.isSaving = false;
      }
    },

    async deleteDevice(id: string): Promise<void> {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/biometric-devices/${id}`, {
          method: 'DELETE',
          headers: this.buildHeaders(),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to delete biometric device');
        }
        this.devices = this.devices.filter((device) => device.id !== id);
      } finally {
        this.isSaving = false;
      }
    },

    async rotateToken(id: string): Promise<string> {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/biometric-devices/${id}/rotate-token`, {
          method: 'POST',
          headers: this.buildHeaders(),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to rotate device token');
        }
        const token = String(body.data?.authToken ?? '');
        this.lastIssuedToken = token || null;
        await this.fetchDevices();
        return token;
      } finally {
        this.isSaving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useBiometricDeviceStore, import.meta.hot));
}

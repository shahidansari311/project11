import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.29.92:4000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds API Timeout (Point 15)
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync("access_token");
      let deviceId = await SecureStore.getItemAsync("device_id");

      if (!deviceId) {
        deviceId = `${Platform.OS}-device-${Math.random().toString(36).substring(7)}`;
        await SecureStore.setItemAsync("device_id", deviceId);
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (deviceId) {
        config.headers["x-device-id"] = deviceId;
      }
    } catch (e) {
      // Ignored
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry Logic (Point 16) for Network Errors, Timeouts, or 5xx Server Errors
    if (
      originalRequest &&
      (!error.response || error.response.status >= 500)
    ) {
      originalRequest._retryCount = originalRequest._retryCount || 0;
      
      if (originalRequest._retryCount < MAX_RETRIES) {
        originalRequest._retryCount += 1;
        
        // Exponential backoff
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(api(originalRequest));
          }, RETRY_DELAY_MS * originalRequest._retryCount);
        });
      }
    }

    // Refresh Token Logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync("refresh_token");
        const deviceId = await SecureStore.getItemAsync("device_id");

        if (!refreshToken || !deviceId) {
          throw new Error("No refresh token available");
        }

        const { data } = await axios.post(`${API_URL}/auth/user/refresh-token`, {
          refreshToken,
        }, {
          headers: { "x-device-id": deviceId }
        });

        const newAccessToken = data.data.token;
        const newRefreshToken = data.data.refreshToken;

        await SecureStore.setItemAsync("access_token", newAccessToken);
        await SecureStore.setItemAsync("refresh_token", newRefreshToken);

        api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (err) {
        processQueue(err as Error, null);
        await SecureStore.deleteItemAsync("access_token");
        await SecureStore.deleteItemAsync("refresh_token");
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

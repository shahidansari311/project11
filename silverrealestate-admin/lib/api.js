import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://192.168.29.249:4000/api/v1';

// Create the axios instance
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Enables browser to send and receive HttpOnly cookies across requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken') || Cookies.get('token');
    const deviceId = typeof window !== 'undefined' ? localStorage.getItem('x-device-id') : null;

    // Set Authorization header if token is accessible in js-cookie (fallback)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (deviceId) {
      config.headers['x-device-id'] = deviceId;
    }

    // If data is FormData, remove application/json Content-Type so Axios/browser sets multipart/form-data with boundary
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
      if (config.headers.common) {
        delete config.headers.common['Content-Type'];
        delete config.headers.common['content-type'];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Singleton: only one refresh request at a time
let refreshPromise = null;

async function refreshAccessToken() {
  const deviceId = typeof window !== 'undefined' ? localStorage.getItem('x-device-id') : null;
  const refreshToken = Cookies.get('refreshToken');

  // Request to refresh token with withCredentials: true (HttpOnly refreshToken cookie is automatically included)
  const response = await axios.post(
    `${BASE_URL}/auth/admin/refresh-token`,
    refreshToken ? { refreshToken } : {},
    {
      withCredentials: true,
      headers: {
        ...(deviceId ? { 'x-device-id': deviceId } : {}),
      },
    }
  );

  const resPayload = response.data;

  if (!resPayload.success) {
    throw new Error(resPayload.message || 'Refresh failed');
  }

  const newToken = resPayload.data?.token || resPayload.data?.accessToken;
  const newRefreshToken = resPayload.data?.refreshToken;

  if (newToken) {
    Cookies.set('token', newToken, { expires: 7 });
  }
  if (newRefreshToken) {
    Cookies.set('refreshToken', newRefreshToken, { expires: 30 });
  }

  return newToken || true;
}

export async function logout() {
  try {
    await api.post('/auth/admin/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    Cookies.remove('token');
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/login';
    }
  }
}

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    // If backend returns 200 but success is false, throw it so components can catch it
    if (response.data && response.data.success === false) {
      return Promise.reject(new Error(response.data.message || 'Something went wrong'));
    }
    // Just return the raw data object to components, so they receive it directly
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and not already retrying
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/admin/login') &&
      !originalRequest.url?.includes('/auth/admin/verify-otp') &&
      !originalRequest.url?.includes('/auth/admin/refresh-token')
    ) {
      originalRequest._retry = true;

      // If a refresh is already in progress, wait for it instead of making a new one
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      try {
        const newToken = await refreshPromise;
        if (typeof newToken === 'string') {
          // Update the header on the original request config if string returned
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        // Retry the original request (withCredentials: true will send HttpOnly cookies)
        return api(originalRequest);
      } catch (refreshError) {
        logout();
        return Promise.reject(refreshError);
      }
    }

    // Handle generic error structure
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }

    return Promise.reject(error);
  }
);

// Export configured instance and helper
export { api as fetchApi };
export default api;

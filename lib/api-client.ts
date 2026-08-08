import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

let toastFn: ((msg: string, opts?: Record<string, unknown>) => void) | null = null;
let toastErrorFn: ((msg: string, opts?: Record<string, unknown>) => void) | null = null;

if (typeof window !== 'undefined') {
  import('sonner').then((m) => {
    toastFn = m.toast;
    toastErrorFn = m.toast.error;
  });
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://api.baravquiz.com/v1';

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setOnUnauthorized(cb: () => void) {
  onUnauthorized = cb;
}

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    setAccessToken(null);
    if (onUnauthorized) onUnauthorized();
  }
}
const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.message ??
      error?.message ??
      'An unexpected error occurred';

    if (status === 401) {
      redirectToLogin();
    }

    if (status && status >= 500) {
      if (toastErrorFn) toastErrorFn('Server error', { description: message });
    }

    return Promise.reject(
      new ApiError(message, status ?? 0, error?.response?.data)
    );
  }
);

export async function apiRequest<T>(
  config: AxiosRequestConfig
): Promise<T> {
  const response = await client.request<T>(config);
  return response.data;
}

export const api = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    apiRequest<T>({ method: 'GET', url, params }),
  post: <T>(url: string, data?: unknown) =>
    apiRequest<T>({ method: 'POST', url, data }),
  put: <T>(url: string, data?: unknown) =>
    apiRequest<T>({ method: 'PUT', url, data }),
  patch: <T>(url: string, data?: unknown) =>
    apiRequest<T>({ method: 'PATCH', url, data }),
  delete: <T>(url: string) => apiRequest<T>({ method: 'DELETE', url }),
};

export default client;

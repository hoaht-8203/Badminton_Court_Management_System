import axios, { isAxiosError } from "axios";

export class ApiError extends Error {
  errors: Record<string, string> | null;
  success: boolean;
  status?: number;

  constructor(
    message: string,
    errors: Record<string, string> | null = null,
    success = false,
    status?: number
  ) {
    super(message);
    this.errors = errors;
    this.success = success;
    this.status = status;
  }
}

let onUnauthorized: (() => void) | undefined;
export const setOnUnauthorized = (cb: (() => void) | undefined) => {
  onUnauthorized = cb;
};

let onForbidden: (() => void) | undefined;
export const setOnForbidden = (cb: (() => void) | undefined) => {
  onForbidden = cb;
};

export type ApiResponse<T> = {
  data: T | null;
  message: string;
  success: boolean;
  errors?: Record<string, string> | null;
};

export const apiBaseUrl = "https://caulong365-api.azurewebsites.net";

export const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Simple in-memory cookie jar for React Native (since it doesn't manage cookies by default)
let cookieJar: string | undefined;

axiosInstance.interceptors.request.use((config) => {
  if (cookieJar) {
    config.headers = {
      ...(config.headers || {}),
      Cookie: cookieJar,
    } as any;
  }
  return config;
});

axiosInstance.interceptors.response.use((response) => {
  const setCookie =
    (response.headers as any)?.["set-cookie"] ||
    (response.headers as any)?.["Set-Cookie"];
  if (setCookie) {
    cookieJar = Array.isArray(setCookie) ? setCookie.join("; ") : setCookie;
  }
  return response;
});

let isRefreshing = false;
type QueueItem = { resolve: () => void; reject: (error: unknown) => void };
const pendingQueue: QueueItem[] = [];
const enqueue = (item: QueueItem) => pendingQueue.push(item);
const resolveQueue = () => {
  while (pendingQueue.length) {
    const { resolve } = pendingQueue.shift()!;
    resolve();
  }
};
const rejectQueue = (error: unknown) => {
  while (pendingQueue.length) {
    const { reject } = pendingQueue.shift()!;
    reject(error);
  }
};

const refreshClient = axios.create({
  baseURL: `${apiBaseUrl}/`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status as number | undefined;
    const originalRequest = error?.config as (typeof error)["config"] & {
      _retry?: boolean;
    };
    const url = (originalRequest?.url || "").toString();
    const isAuthEndpoint =
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/refresh-token");

    if (status === 401 && originalRequest && !isAuthEndpoint) {
      if (originalRequest._retry) {
        onUnauthorized?.();
        return Promise.reject(new ApiError("Unauthorized", null, false, 401));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          enqueue({
            resolve: () => {
              originalRequest._retry = true;
              axiosInstance(originalRequest).then(resolve).catch(reject);
            },
            reject,
          });
        });
      }

      isRefreshing = true;
      try {
        await refreshClient.post("/api/auth/refresh-token");
        resolveQueue();
        originalRequest._retry = true;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        rejectQueue(refreshError);
        onUnauthorized?.();
        const refreshStatus = (refreshError as any)?.response?.status as
          | number
          | undefined;
        if (refreshStatus === 400)
          return Promise.reject(
            new ApiError(
              "Bạn chưa đăng nhập. Hãy đăng nhập để sử dụng dịch vụ",
              null,
              false,
              401
            )
          );
        return Promise.reject(
          new ApiError(
            "Refresh token đã hết hạn. Vui lòng đăng nhập lại.",
            null,
            false,
            401
          )
        );
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 403) {
      onForbidden?.();
    }

    if (isAxiosError(error) && error.response?.data) {
      const apiRes = error.response.data as ApiResponse<unknown>;
      const apiError = new ApiError(
        apiRes.message || "Unknown error",
        apiRes.errors || null,
        apiRes.success ?? false,
        error.response.status
      );
      if (apiError.status === 401) onUnauthorized?.();
      return Promise.reject(apiError);
    }

    const fallback = new ApiError(
      error?.message || "Unknown error",
      null,
      false,
      error?.response?.status
    );
    if (fallback.status === 401) onUnauthorized?.();
    return Promise.reject(fallback);
  }
);

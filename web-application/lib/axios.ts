import { ApiResponse } from "@/types/api";
import axios from "axios";

// Tạo class ApiError chuẩn
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

export const axiosInstance = axios.create({
  baseURL: "http://localhost:5039/",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Refresh token logic with request queue to dedupe concurrent 401s
let isRefreshing = false;
type QueueItem = {
  resolve: () => void;
  reject: (error: unknown) => void;
};
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

// A lightweight client to call refresh endpoint without causing interceptor recursion issues
const refreshClient = axios.create({
  baseURL: "http://localhost:5039/",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Only handle 401 from our API
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
        // Prevent infinite loop
        return Promise.reject(new ApiError("Unauthorized", null, false, 401));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          enqueue({
            resolve: () => {
              // After refresh is done, retry the original request
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
        return Promise.reject(
          new ApiError("Session expired. Please login again.", null, false, 401)
        );
      } finally {
        isRefreshing = false;
      }
    }

    // Otherwise, normalize error to ApiError
    if (axios.isAxiosError(error) && error.response?.data) {
      const apiRes = error.response.data as ApiResponse<unknown>;
      return Promise.reject(
        new ApiError(
          (apiRes as any)?.message || "Unknown error",
          (apiRes as any)?.errors || null,
          (apiRes as any)?.success ?? false,
          error.response.status
        )
      );
    }

    return Promise.reject(
      new ApiError(
        error?.message || "Unknown error",
        null,
        false,
        error?.response?.status
      )
    );
  }
);

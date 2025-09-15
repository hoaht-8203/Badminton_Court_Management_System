export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors?: Record<string, string> | null;
};

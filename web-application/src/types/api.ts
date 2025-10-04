export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors?: Record<string, string> | null;
};

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export type ApiPagedResponse<T> = ApiResponse<PagedResponse<T>>;

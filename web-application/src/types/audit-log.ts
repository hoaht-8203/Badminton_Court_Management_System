// Audit Log DTOs
export interface AuditLogDto {
  id: string;
  tableName: string;
  action: string; // "Create" | "Update" | "Delete"
  entityId: string;
  oldValues?: string | null;
  newValues?: string | null;
  changedColumns?: string | null;
  userId?: string | null;
  userName?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  timestamp: string;
  createdAt: string;
  updatedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface AuditLogDetailDto {
  id: string;
  tableName: string;
  action: string;
  entityId: string;
  changedColumns?: string | null;
  oldValuesObject?: any;
  newValuesObject?: any;
  userId?: string | null;
  userName?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  timestamp: string;
}

export interface AuditLogQueryDto {
  tableName?: string | null;
  action?: string | null;
  userId?: string | null;
  entityId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  searchKeyword?: string | null;
  page?: number;
  pageSize?: number;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export type AuditLogResponseDto = PagedResponse<AuditLogDto>;

export const AuditAction = {
  Create: "Create",
  Update: "Update",
  Delete: "Delete",
} as const;

export type AuditActionType = typeof AuditAction[keyof typeof AuditAction];

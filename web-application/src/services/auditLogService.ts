import { axiosInstance } from "@/lib/axios";
import {
  AuditLogDto,
  AuditLogDetailDto,
  AuditLogQueryDto,
  AuditLogResponseDto,
} from "@/types/audit-log";

export const auditLogService = {
  /**
   * Get paginated audit logs with filters
   */
  async getAuditLogs(query: AuditLogQueryDto): Promise<AuditLogResponseDto> {
    const params = new URLSearchParams();
    
    if (query.tableName) params.append("tableName", query.tableName);
    if (query.action) params.append("action", query.action);
    if (query.userId) params.append("userId", query.userId);
    if (query.entityId) params.append("entityId", query.entityId);
    if (query.dateFrom) params.append("dateFrom", query.dateFrom);
    if (query.dateTo) params.append("dateTo", query.dateTo);
    if (query.searchKeyword) params.append("searchKeyword", query.searchKeyword);
    if (query.page) params.append("page", query.page.toString());
    if (query.pageSize) params.append("pageSize", query.pageSize.toString());

    const res = await axiosInstance.get<AuditLogResponseDto>(
      `/api/auditlogs?${params.toString()}`
    );
    return res.data;
  },

  /**
   * Get audit log detail by ID
   */
  async getAuditLogDetail(id: string): Promise<AuditLogDetailDto> {
    const res = await axiosInstance.get<AuditLogDetailDto>(`/api/auditlogs/${id}`);
    return res.data;
  },

  /**
   * Get change history for a specific entity
   */
  async getEntityHistory(tableName: string, entityId: string): Promise<{
    tableName: string;
    entityId: string;
    history: AuditLogDto[];
  }> {
    const params = new URLSearchParams();
    params.append("tableName", tableName);
    params.append("entityId", entityId);

    const res = await axiosInstance.get<{
      tableName: string;
      entityId: string;
      history: AuditLogDto[];
    }>(`/api/auditlogs/entity-history?${params.toString()}`);
    return res.data;
  },

  /**
   * Get audit logs by user
   */
  async getByUser(userId: string, page = 1, pageSize = 10): Promise<AuditLogResponseDto> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    const res = await axiosInstance.get<AuditLogResponseDto>(
      `/api/auditlogs/by-user/${userId}?${params.toString()}`
    );
    return res.data;
  },

  /**
   * Get audit logs by table name
   */
  async getByTable(tableName: string, page = 1, pageSize = 10): Promise<AuditLogResponseDto> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    const res = await axiosInstance.get<AuditLogResponseDto>(
      `/api/auditlogs/by-table/${tableName}?${params.toString()}`
    );
    return res.data;
  },

  /**
   * Get audit logs by action type
   */
  async getByAction(action: string, page = 1, pageSize = 10): Promise<AuditLogResponseDto> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    const res = await axiosInstance.get<AuditLogResponseDto>(
      `/api/auditlogs/by-action/${action}?${params.toString()}`
    );
    return res.data;
  },

  /**
   * Delete old audit logs (Admin only)
   */
  async deleteOldLogs(daysToKeep: number): Promise<{
    message: string;
    deletedCount: number;
  }> {
    const params = new URLSearchParams();
    params.append("daysToKeep", daysToKeep.toString());

    const res = await axiosInstance.delete<{
      message: string;
      deletedCount: number;
    }>(`/api/auditlogs/cleanup?${params.toString()}`);
    return res.data;
  },

  /**
   * Export audit logs as CSV
   */
  async exportAuditLogs(query: Omit<AuditLogQueryDto, "page" | "pageSize">): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (query.tableName) params.append("tableName", query.tableName);
    if (query.action) params.append("action", query.action);
    if (query.userId) params.append("userId", query.userId);
    if (query.dateFrom) params.append("dateFrom", query.dateFrom);
    if (query.dateTo) params.append("dateTo", query.dateTo);

    const res = await axiosInstance.get(`/api/auditlogs/export?${params.toString()}`, {
      responseType: "blob",
    });
    return res.data;
  },
};

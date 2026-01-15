using System;
using ApiApplication.Dtos.Pagination;

namespace ApiApplication.Dtos.AuditLog;

public class AuditLogQueryDto : PaginationRequest
{
    public string? TableName { get; set; }

    public string? Action { get; set; }

    public string? UserId { get; set; }

    public string? EntityId { get; set; }

    public DateTime? DateFrom { get; set; }

    public DateTime? DateTo { get; set; }

    public string? SearchKeyword { get; set; }
}

using System;
using ApiApplication.Dtos.Pagination;

namespace ApiApplication.Dtos.AuditLog;

public class AuditLogResponseDto : PagedResponse<AuditLogDto>
{
}

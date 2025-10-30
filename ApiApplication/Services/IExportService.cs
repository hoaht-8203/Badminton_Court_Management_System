using System;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Services;

public interface IExportService
{
    Task<FileContentResult> ExportBookingHistoryAsync();
}

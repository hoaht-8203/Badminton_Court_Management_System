using ApiApplication.Authorization;
using ApiApplication.Dtos;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = PolicyConstants.ManagementOnly)]
    public class ExportsController(IExportService exportService) : ControllerBase
    {
        private readonly IExportService _exportService = exportService;

        [HttpGet("booking-history")]
        public async Task<IActionResult> ExportBookingHistoryAsync()
        {
            var result = await _exportService.ExportBookingHistoryAsync();
            return result;
        }
    }
}

using ApiApplication.Dtos;
using ApiApplication.Dtos.Attendance;
using ApiApplication.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AttendanceController : ControllerBase
    {
        private readonly IAttendanceService _attendanceService;

        public AttendanceController(IAttendanceService attendanceService)
        {
            _attendanceService = attendanceService;
        }

        [HttpPost]
        public async Task<IActionResult> UpdateAttendanceRecord([FromBody] AttendanceRequest request)
        {
            var result = await _attendanceService.AddOrUpdateAttendanceRecordAsync(request);
            return Ok(ApiResponse<bool>.SuccessResponse(result, "Cập nhật chấm công thành công"));
        }
        [HttpGet("{attendanceRecordId}")]
        public async Task<IActionResult> GetAttendanceRecordById(int attendanceRecordId)
        {
            var result = await _attendanceService.GetAttendanceRecordByIdAsync(attendanceRecordId);
            return Ok(ApiResponse<AttendanceResponse?>.SuccessResponse(result, "Get attendance record successfully"));
        }
    }
}

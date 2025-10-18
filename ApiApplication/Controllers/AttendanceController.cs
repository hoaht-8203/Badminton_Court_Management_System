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
        public async Task<IActionResult> AddAttendanceRecord([FromBody] AttendanceRequest request)
        {
            var result = await _attendanceService.AddAttendanceRecordAsync(request);
            return Ok(ApiResponse<bool>.SuccessResponse(result, "Thêm chấm công thành công"));
        }

        [HttpPut]
        public async Task<IActionResult> UpdateAttendanceRecord(
            [FromBody] AttendanceRequest request
        )
        {
            var result = await _attendanceService.UpdateAttendanceRecordAsync(request);
            return Ok(ApiResponse<bool>.SuccessResponse(result, "Cập nhật chấm công thành công"));
        }

        [HttpGet("staff/{staffId}")]
        public async Task<IActionResult> GetAttendanceRecordsByStaffId(
            int staffId,
            [FromQuery] DateTime date
        )
        {
            var result = await _attendanceService.GetAttendanceRecordsByStaffIdAsync(staffId, date);
            return Ok(
                ApiResponse<List<AttendanceResponse>>.SuccessResponse(
                    result,
                    "Get attendance records successfully"
                )
            );
        }

        [HttpDelete("{attendanceRecordId}")]
        public async Task<IActionResult> DeleteAttendanceRecord(int attendanceRecordId)
        {
            var result = await _attendanceService.DeleteAttendanceRecordAsync(attendanceRecordId);
            return Ok(ApiResponse<bool>.SuccessResponse(result, "Xoá chấm công thành công"));
        }
    }
}

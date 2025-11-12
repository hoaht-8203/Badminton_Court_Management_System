using ApiApplication.Dtos;
using ApiApplication.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ScheduleController : ControllerBase
    {
        private readonly IScheduleService _scheduleService;

        public ScheduleController(IScheduleService scheduleService)
        {
            _scheduleService = scheduleService;
        }

        [HttpGet("by-shift")]
        public async Task<
            ActionResult<ApiResponse<List<ScheduleByShiftResponse>>>
        > GetScheduleOfWeekByShift([FromQuery] WeeklyScheduleRequest request)
        {
            var result = await _scheduleService.GetScheduleOfWeekByShiftAsync(request);
            return Ok(
                ApiResponse<List<ScheduleByShiftResponse>>.SuccessResponse(
                    result,
                    "Get schedule of week by shift successfully"
                )
            );
        }

        [HttpGet("by-staff")]
        public async Task<
            ActionResult<ApiResponse<List<ScheduleByStaffResponse>>>
        > GetScheduleOfWeekByStaff([FromQuery] WeeklyScheduleRequest request)
        {
            var result = await _scheduleService.GetScheduleOfWeekByStaffAsync(request);
            return Ok(
                ApiResponse<List<ScheduleByStaffResponse>>.SuccessResponse(
                    result,
                    "Get schedule of week by staff successfully"
                )
            );
        }

        [HttpGet("by-staff/{staffId}")]
        public async Task<
            ActionResult<ApiResponse<List<ScheduleResponse>>>
        > GetScheduleOfWeekByStaffId([FromQuery] ScheduleRequest request, int staffId)
        {
            var result = await _scheduleService.GetScheduleOfWeekByStaffIdAsync(request, staffId);
            return Ok(
                ApiResponse<List<ScheduleResponse>>.SuccessResponse(
                    result,
                    "Get schedule of week by staff successfully"
                )
            );
        }

        [HttpPost("assign")]
        public async Task<ActionResult<ApiResponse<bool>>> AssignSchedule(
            [FromBody] ScheduleRequest request
        )
        {
            var result = await _scheduleService.AssignShiftToStaffAsync(request);
            return Ok(ApiResponse<bool>.SuccessResponse(result, "Assign schedule successfully"));
        }

        [HttpPost("remove")]
        public async Task<ActionResult<ApiResponse<object?>>> RemoveSchedule(
            [FromBody] ScheduleRequest request
        )
        {
            await _scheduleService.RemoveStaffFromShiftAsync(request);
            return Ok(
                ApiResponse<object?>.SuccessResponse(null, "Remove staff from shift successfully")
            );
        }
    }
}

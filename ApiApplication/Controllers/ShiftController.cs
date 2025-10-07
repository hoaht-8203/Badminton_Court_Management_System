using ApiApplication.Dtos;
using ApiApplication.Exceptions;
using ApiApplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShiftController : ControllerBase
    {
        private readonly IShiftService _shiftService;

        public ShiftController(IShiftService shiftService)
        {
            _shiftService = shiftService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<ShiftResponse>>>> GetAll(
            [FromQuery] bool includeInactive = false
        )
        {
            var result = await _shiftService.GetAllShiftsAsync(includeInactive);
            return Ok(
                ApiResponse<List<ShiftResponse>>.SuccessResponse(
                    result,
                    "Lấy tất cả ca làm việc thành công"
                )
            );
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<ShiftResponse?>>> GetById(int id)
        {
            var result = await _shiftService.GetShiftByIdAsync(id);
            return Ok(
                ApiResponse<ShiftResponse?>.SuccessResponse(
                    result,
                    "Lấy ca làm việc theo id thành công"
                )
            );
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<object?>>> Create(
            [FromBody] ShiftRequest request
        )
        {
            await _shiftService.CreateShiftAsync(request);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Tạo ca làm việc thành công"));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<object?>>> Update(
            int id,
            [FromBody] ShiftRequest request
        )
        {
            await _shiftService.UpdateShiftAsync(id, request);
            return Ok(
                ApiResponse<object?>.SuccessResponse(null, "Cập nhật ca làm việc thành công")
            );
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object?>>> Delete(int id)
        {
            await _shiftService.DeleteShiftAsync(id);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Xóa ca làm việc thành công"));
        }
    }
}

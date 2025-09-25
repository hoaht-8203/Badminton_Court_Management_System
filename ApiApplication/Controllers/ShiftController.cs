using ApiApplication.Exceptions;
using ApiApplication.Dtos;
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
        public async Task<ActionResult<ApiResponse<List<ShiftResponse>>>> GetAll()
        {
            try
            {
                var result = await _shiftService.GetAllShiftsAsync();
                return Ok(ApiResponse<List<ShiftResponse>>.SuccessResponse(result, "Lấy tất cả ca làm việc thành công"));
            }
            catch (ApiException ex)
            {
                return StatusCode((int)ex.StatusCode, ApiResponse<List<ShiftResponse>>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<List<ShiftResponse>>.ErrorResponse($"Lỗi server: {ex.Message}"));
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<ShiftResponse>>> GetById(int id)
        {
            try
            {
                var result = await _shiftService.GetShiftByIdAsync(id);
                return Ok(ApiResponse<ShiftResponse>.SuccessResponse(result, "Lấy ca làm việc theo id thành công"));
            }
            catch (ApiException ex)
            {
                return StatusCode((int)ex.StatusCode, ApiResponse<ShiftResponse>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<ShiftResponse>.ErrorResponse($"Lỗi server: {ex.Message}"));
            }
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<object?>>> Create([FromBody] ShiftRequest request)
        {
            try
            {
                await _shiftService.CreateShiftAsync(request);
                return Ok(ApiResponse<object?>.SuccessResponse(null, "Tạo ca làm việc thành công"));
            }
            catch (ApiException ex)
            {
                return StatusCode((int)ex.StatusCode, ApiResponse<object?>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object?>.ErrorResponse($"Lỗi server: {ex.Message}"));
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<object?>>> Update(int id, [FromBody] ShiftRequest request)
        {
            try
            {
                await _shiftService.UpdateShiftAsync(id, request);
                return Ok(ApiResponse<object?>.SuccessResponse(null, "Cập nhật ca làm việc thành công"));
            }
            catch (ApiException ex)
            {
                return StatusCode((int)ex.StatusCode, ApiResponse<object?>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object?>.ErrorResponse($"Lỗi cập nhật ca làm việc: {ex.Message}"));
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object?>>> Delete(int id)
        {
            try
            {
                await _shiftService.DeleteShiftAsync(id);
                return Ok(ApiResponse<object?>.SuccessResponse(null, "Xóa ca làm việc thành công"));
            }
            catch (ApiException ex)
            {
                return StatusCode((int)ex.StatusCode, ApiResponse<object?>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object?>.ErrorResponse($"Lỗi server: {ex.Message}"));
            }
        }
    }
}

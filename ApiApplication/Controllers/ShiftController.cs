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
            var result = await _shiftService.GetAllShiftsAsync();
            return Ok(ApiResponse<List<ShiftResponse>>.SuccessResponse(result, "Get all shifts successfully"));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<ShiftResponse>>> GetById(int id)
        {
            var result = await _shiftService.GetShiftByIdAsync(id);
            if (result == null)
                return NotFound(ApiResponse<ShiftResponse>.ErrorResponse($"Shift with id {id} not found"));
            return Ok(ApiResponse<ShiftResponse>.SuccessResponse(result, "Get shift by id successfully"));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<object?>>> Create([FromBody] ShiftRequest request)
        {
            await _shiftService.CreateShiftAsync(request);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Create shift successfully"));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<object?>>> Update(int id, [FromBody] ShiftRequest request)
        {
            await _shiftService.UpdateShiftAsync(id, request);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Update shift successfully"));
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object?>>> Delete(int id)
        {
            await _shiftService.DeleteShiftAsync(id);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Delete shift successfully"));
        }
    }
}

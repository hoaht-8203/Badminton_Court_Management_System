using ApiApplication.Dtos;
using ApiApplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StaffController : ControllerBase
    {
        private readonly IStaffService _staffService;

        public StaffController(IStaffService staffService)
        {
            _staffService = staffService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<StaffResponse>>>> GetAll()
        {
            var result = await _staffService.GetAllStaffAsync();
            return Ok(ApiResponse<List<StaffResponse>>.SuccessResponse(result, "Get all staff successfully"));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<StaffResponse>>> GetById(int id)
        {
            var result = await _staffService.GetStaffByIdAsync(id);
                if (result == null)
                    return NotFound(ApiResponse<StaffResponse>.ErrorResponse($"Staff with id {id} not found"));
            return Ok(ApiResponse<StaffResponse>.SuccessResponse(result, "Get staff by id successfully"));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<object?>>> Create([FromBody] StaffRequest request)
        {
            await _staffService.CreateStaffAsync(request);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Create staff successfully"));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<object?>>> Update(int id, [FromBody] StaffRequest request)
        {
            await _staffService.UpdateStaffAsync(request, id);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Update staff successfully"));
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object?>>> Delete(int id)
        {
            await _staffService.DeleteStaffAsync(id);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Delete staff successfully"));
        }
    }
}

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
        public async Task<ActionResult<ApiResponse<List<StaffResponse>>>> GetAll([FromQuery] ListStaffRequest request)
        {
            var result = await _staffService.GetAllStaffAsync(request);
            return Ok(ApiResponse<List<StaffResponse>>.SuccessResponse(result, "Lấy tất cả nhân viên thành công"));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<StaffResponse>>> GetById(int id)
        {
            var result = await _staffService.GetStaffByIdAsync(id);
            if (result == null)
                return NotFound(ApiResponse<StaffResponse>.ErrorResponse($"Nhân viên với id {id} không tìm thấy"));
            return Ok(ApiResponse<StaffResponse>.SuccessResponse(result, "Lấy nhân viên theo id thành công"));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<object?>>> Create([FromBody] StaffRequest request)
        {
            await _staffService.CreateStaffAsync(request);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Tạo nhân viên thành công"));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<object?>>> Update(int id, [FromBody] StaffRequest request)
        {
            await _staffService.UpdateStaffAsync(request, id);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Cập nhật nhân viên thành công"));
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object?>>> Delete(int id)
        {
            await _staffService.DeleteStaffAsync(id);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Xóa nhân viên thành công"));
        }
    }
}

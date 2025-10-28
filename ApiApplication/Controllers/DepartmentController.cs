using ApiApplication.Dtos;
using ApiApplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DepartmentController : ControllerBase
    {
        private readonly IDepartmentService _departmentService;

        public DepartmentController(IDepartmentService departmentService)
        {
            _departmentService = departmentService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<DepartmentResponse>>>> GetAll([FromQuery] ListDepartmentRequest request)
        {
            var result = await _departmentService.GetAllDepartmentsAsync(request);
            return Ok(ApiResponse<List<DepartmentResponse>>.SuccessResponse(result, "Lấy danh sách phòng ban thành công"));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<DepartmentResponse>>> GetById(int id)
        {
            var result = await _departmentService.GetDepartmentByIdAsync(id);
            if (result == null)
                return NotFound(ApiResponse<DepartmentResponse>.ErrorResponse($"Phòng ban với id {id} không tìm thấy"));
            return Ok(ApiResponse<DepartmentResponse>.SuccessResponse(result, "Lấy phòng ban theo id thành công"));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<object?>>> Create([FromBody] DepartmentRequest request)
        {
            await _departmentService.CreateDepartmentAsync(request);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Tạo phòng ban thành công"));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<object?>>> Update(int id, [FromBody] DepartmentRequest request)
        {
            await _departmentService.UpdateDepartmentAsync(request, id);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Cập nhật phòng ban thành công"));
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object?>>> Delete(int id)
        {
            await _departmentService.DeleteDepartmentAsync(id);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Xóa phòng ban thành công"));
        }
    }
}

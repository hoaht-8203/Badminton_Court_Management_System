using ApiApplication.Dtos;
using ApiApplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SalaryFormController : ControllerBase
    {
        private readonly ISalaryFormService _salaryFormService;

        public SalaryFormController(ISalaryFormService salaryFormService)
        {
            _salaryFormService = salaryFormService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<SalaryFormResponse>>>> GetAll()
        {
            var result = await _salaryFormService.GetAllSalaryFormsAsync();
            return Ok(ApiResponse<List<SalaryFormResponse>>.SuccessResponse(result, "Get all salary forms successfully"));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<SalaryFormResponse>>> GetById(int id)
        {
            var result = await _salaryFormService.GetSalaryFormByIdAsync(id);
            if (result == null)
                return NotFound(ApiResponse<SalaryFormResponse>.ErrorResponse($"SalaryForm with id {id} not found"));
            return Ok(ApiResponse<SalaryFormResponse>.SuccessResponse(result, "Get salary form by id successfully"));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<object?>>> Create([FromBody] SalaryFormRequest request)
        {
            await _salaryFormService.CreateSalaryFormAsync(request);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Create salary form successfully"));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<object?>>> Update(int id, [FromBody] SalaryFormRequest request)
        {
            await _salaryFormService.UpdateSalaryFormAsync(id, request);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Update salary form successfully"));
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object?>>> Delete(int id)
        {
            await _salaryFormService.DeleteSalaryFormAsync(id);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Delete salary form successfully"));
        }
    }
}

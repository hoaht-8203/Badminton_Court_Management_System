using ApiApplication.Dtos;
using ApiApplication.Dtos.Payroll;
using ApiApplication.Entities;
using ApiApplication.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PayrollController : ControllerBase
    {
        private readonly IPayrollService _payrollService;

        public PayrollController(IPayrollService payrollService)
        {
            _payrollService = payrollService;
        }

        // POST: api/Payroll
        [HttpPost]
        public async Task<IActionResult> CreatePayroll([FromBody] CreatePayrollRequest request)
        {
            var result = await _payrollService.CreatePayrollAsync(request);
            return Ok(ApiResponse<object?>.SuccessResponse(result, "Tạo bảng lương thành công"));
        }

        // GET: api/Payroll
        [HttpGet]
        public async Task<IActionResult> GetPayrolls()
        {
            var result = await _payrollService.GetPayrollsAsync();
            return Ok(
                ApiResponse<List<ListPayrollResponse>>.SuccessResponse(
                    result,
                    "Lấy danh sách bảng lương thành công"
                )
            );
        }

        // POST: api/Payroll/refresh/{payrollId}
        [HttpPost("refresh/{payrollId}")]
        public async Task<IActionResult> RefreshPayroll(int payrollId)
        {
            var result = await _payrollService.RefreshPayrollAsync(payrollId);
            return Ok(
                ApiResponse<object?>.SuccessResponse(result, "Cập nhật bảng lương thành công")
            );
        }

        // Pay the bill
        // POST: api/Payroll/pay-item/{payrollItemId}
        [HttpPost("pay-item/{payrollItemId}")]
        public async Task<IActionResult> PayPayrollItem(
            int payrollItemId,
            [FromQuery] decimal amount
        )
        {
            var result = await _payrollService.PayPayrollItemAsync(payrollItemId, amount);
            return Ok(
                ApiResponse<object?>.SuccessResponse(result, "Thanh toán phiếu lương thành công")
            );
        }

        // GET: api/Payroll/{payrollId}
        [HttpGet("{payrollId}")]
        public async Task<IActionResult> GetPayrollById(int payrollId)
        {
            var result = await _payrollService.GetPayrollByIdAsync(payrollId);
            if (result == null)
                return NotFound(
                    ApiResponse<PayrollDetailResponse>.ErrorResponse(
                        $"Bảng lương với id {payrollId} không tìm thấy"
                    )
                );
            return Ok(
                ApiResponse<PayrollDetailResponse>.SuccessResponse(
                    result,
                    "Lấy bảng lương theo id thành công"
                )
            );
        }
    }
}

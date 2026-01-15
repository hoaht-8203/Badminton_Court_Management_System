using ApiApplication.Authorization;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Payroll;
using ApiApplication.Entities;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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

        // GET: api/Payroll/me - Get current user's payroll items
        [HttpGet("me")]
        [Authorize(Policy = PolicyConstants.StaffAccess)]
        public async Task<IActionResult> GetMyPayrollItems()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ApiResponse<List<PayrollItemResponse>>.ErrorResponse("Không tìm thấy thông tin người dùng"));
            }

            var result = await _payrollService.GetMyPayrollItemsAsync(userId);
            return Ok(
                ApiResponse<List<PayrollItemResponse>>.SuccessResponse(
                    result,
                    "Lấy thông tin bảng lương thành công"
                )
            );
        }

        // POST: api/Payroll
        [HttpPost]
        [Authorize(Policy = PolicyConstants.ManagementOnly)]
        public async Task<IActionResult> CreatePayroll([FromBody] CreatePayrollRequest request)
        {
            var result = await _payrollService.CreatePayrollAsync(request);
            return Ok(ApiResponse<object?>.SuccessResponse(result, "Tạo bảng lương thành công"));
        }

        // GET: api/Payroll
        [HttpGet]
        [Authorize(Policy = PolicyConstants.ManagementOnly)]
        public async Task<IActionResult> GetPayrolls([FromQuery] ListPayrollRequest? request)
        {
            var result = await _payrollService.GetPayrollsAsync(request);
            return Ok(
                ApiResponse<List<ListPayrollResponse>>.SuccessResponse(
                    result,
                    "Lấy danh sách bảng lương thành công"
                )
            );
        }

        // POST: api/Payroll/refresh/{payrollId}
        [HttpPost("refresh/{payrollId}")]
        [Authorize(Policy = PolicyConstants.ManagementOnly)]
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
        [Authorize(Policy = PolicyConstants.ManagementOnly)]
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
        [Authorize(Policy = PolicyConstants.ManagementOnly)]
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

        // GET: api/Payroll/items/by-staff/{staffId}
        [HttpGet("items/by-staff/{staffId}")]
        [Authorize(Policy = PolicyConstants.ManagementOnly)]
        public async Task<IActionResult> GetPayrollItemsByStaffId(int staffId)
        {
            var result = await _payrollService.GetPayrollItemsByStaffIdAsync(staffId);
            return Ok(
                ApiResponse<List<PayrollItemResponse>>.SuccessResponse(
                    result,
                    "Lấy phiếu lương theo nhân viên thành công"
                )
            );
        }

        // DELETE: api/Payroll/{payrollId}
        [HttpDelete("{payrollId}")]
        [Authorize(Policy = PolicyConstants.ManagementOnly)]
        public async Task<IActionResult> DeletePayroll(int payrollId)
        {
            var result = await _payrollService.DeletePayrollAsync(payrollId);
            return Ok(
                ApiResponse<object?>.SuccessResponse(result, "Hủy bảng lương thành công")
            );
        }
    }
}

using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Voucher;
using ApiApplication.Services;
using ApiApplication.Sessions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VouchersController(
    IVoucherService voucherService,
    ICurrentUser currentUser,
    ApplicationDbContext context
) : ControllerBase
{
    private readonly IVoucherService _voucherService = voucherService;
    private readonly ICurrentUser _currentUser = currentUser;
    private readonly ApplicationDbContext _context = context;

    [HttpGet("list")]
    public async Task<ApiResponse<VoucherResponse[]>> List()
    {
        var data = await _voucherService.ListAsync();
        return ApiResponse<VoucherResponse[]>.SuccessResponse(data.ToArray());
    }

    [HttpGet("detail")]
    public async Task<ApiResponse<VoucherResponse?>> Detail(
        [FromQuery] DetailVoucherRequest request
    )
    {
        var data = await _voucherService.DetailAsync(request.Id);
        return ApiResponse<VoucherResponse?>.SuccessResponse(data);
    }

    [HttpPost("create")]
    public async Task<ApiResponse<object?>> Create([FromBody] CreateVoucherRequest request)
    {
        await _voucherService.CreateAsync(request);
        return ApiResponse<object?>.SuccessResponse(null, "Tạo voucher thành công");
    }

    [HttpPut("update/{id}")]
    public async Task<ApiResponse<object?>> Update(int id, [FromBody] UpdateVoucherRequest request)
    {
        await _voucherService.UpdateAsync(id, request);
        return ApiResponse<object?>.SuccessResponse(null, "Cập nhật voucher thành công");
    }

    [HttpDelete("delete")]
    public async Task<ApiResponse<object?>> Delete([FromQuery] DeleteVoucherRequest request)
    {
        await _voucherService.DeleteAsync(request.Id);
        return ApiResponse<object?>.SuccessResponse(null, "Xóa voucher thành công");
    }

    [HttpGet("available")]
    public async Task<ApiResponse<VoucherResponse[]>> GetAvailableVouchers()
    {
        var data = await _voucherService.GetAvailableVouchersForCurrentUserAsync();
        return ApiResponse<VoucherResponse[]>.SuccessResponse(data.ToArray());
    }

    [HttpPost("validate")]
    public async Task<ApiResponse<ValidateVoucherResponse>> ValidateVoucher(
        [FromBody] ValidateVoucherRequest request
    )
    {
        // Get current user's customer ID
        var userId = _currentUser.UserId;
        if (userId == null)
        {
            return ApiResponse<ValidateVoucherResponse>.ErrorResponse("Người dùng chưa đăng nhập");
        }

        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
        if (customer == null)
        {
            return ApiResponse<ValidateVoucherResponse>.ErrorResponse(
                "Không tìm thấy thông tin khách hàng"
            );
        }

        var result = await _voucherService.ValidateAndCalculateDiscountAsync(request, customer.Id);

        if (!result.IsValid)
        {
            return ApiResponse<ValidateVoucherResponse>.ErrorResponse(
                result.ErrorMessage ?? "Voucher không hợp lệ"
            );
        }

        return ApiResponse<ValidateVoucherResponse>.SuccessResponse(result);
    }
}

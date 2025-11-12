using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Voucher;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
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

    #region CRUD Operations

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

    #endregion

    #region Business Operations

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
        // Resolve customer ID: prefer explicit CustomerId (used by staff), otherwise resolve by current user
        var customerIdResult = await ResolveCustomerIdAsync(request.CustomerId);
        if (!customerIdResult.Success)
        {
            return ApiResponse<ValidateVoucherResponse>.ErrorResponse(
                customerIdResult.ErrorMessage!
            );
        }

        // Validate voucher with resolved customer ID
        var result = await _voucherService.ValidateAndCalculateDiscountAsync(
            request,
            customerIdResult.CustomerId
        );

        if (!result.IsValid)
        {
            return ApiResponse<ValidateVoucherResponse>.ErrorResponse(
                result.ErrorMessage ?? "Voucher không hợp lệ"
            );
        }

        return ApiResponse<ValidateVoucherResponse>.SuccessResponse(result);
    }

    #endregion

    #region Private Helper Methods

    /// <summary>
    /// Resolves customer ID from request or current user.
    /// Auto-creates customer if it doesn't exist for current user.
    /// </summary>
    private async Task<(bool Success, int CustomerId, string? ErrorMessage)> ResolveCustomerIdAsync(
        int? customerIdFromRequest
    )
    {
        // If customer ID is explicitly provided (staff flow), validate it exists
        if (customerIdFromRequest.HasValue)
        {
            var customerExists = await _context.Customers.AnyAsync(c =>
                c.Id == customerIdFromRequest.Value
            );
            if (!customerExists)
            {
                return (false, 0, "Không tìm thấy thông tin khách hàng");
            }

            return (true, customerIdFromRequest.Value, null);
        }

        // Otherwise, resolve by current user
        var userId = _currentUser.UserId;
        if (userId == null)
        {
            return (false, 0, "Người dùng chưa đăng nhập");
        }

        var user = await _context
            .Users.Include(u => u.Customer)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return (false, 0, "Người dùng không tồn tại");
        }

        // Auto-create customer if it doesn't exist (similar to BookingCourtService)
        if (user.Customer == null)
        {
            await EnsureCustomerExistsForUserAsync(user);
        }

        return (true, user.Customer!.Id, null);
    }

    /// <summary>
    /// Creates a customer record for the given user if it doesn't exist.
    /// </summary>
    private async Task EnsureCustomerExistsForUserAsync(ApplicationUser user)
    {
        if (user.Customer != null)
        {
            return;
        }

        var customer = new Customer
        {
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber ?? "",
            Email = user.Email ?? "",
            Status = CustomerStatus.Active,
            UserId = user.Id,
        };

        await _context.Customers.AddAsync(customer);
        user.Customer = customer;
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
    }

    #endregion
}

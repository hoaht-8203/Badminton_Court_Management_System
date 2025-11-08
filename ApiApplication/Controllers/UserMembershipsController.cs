using ApiApplication.Dtos;
using ApiApplication.Dtos.Membership.UserMembership;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserMembershipsController(IUserMembershipService userMembershipService)
    : ControllerBase
{
    private readonly IUserMembershipService _userMembershipService = userMembershipService;

    [HttpGet("list")]
    public async Task<ApiResponse<UserMembershipResponse[]>> List(
        [FromQuery] ListUserMembershipRequest request
    )
    {
        var data = await _userMembershipService.ListAsync(request);
        return ApiResponse<UserMembershipResponse[]>.SuccessResponse(data.ToArray());
    }

    [HttpGet("detail")]
    public async Task<ApiResponse<UserMembershipResponse>> Detail([FromQuery] int id)
    {
        var data = await _userMembershipService.DetailAsync(id);
        return ApiResponse<UserMembershipResponse>.SuccessResponse(data);
    }

    [HttpPost("create")]
    public async Task<ApiResponse<CreateUserMembershipResponse>> Create(
        [FromBody] CreateUserMembershipRequest request
    )
    {
        var data = await _userMembershipService.CreateAsync(request);
        return ApiResponse<CreateUserMembershipResponse>.SuccessResponse(
            data,
            "Gán gói hội viên cho khách hàng thành công"
        );
    }

    [HttpPost("create-for-current-user")]
    public async Task<ApiResponse<CreateUserMembershipResponse>> CreateForCurrentUser(
        [FromBody] CreateUserMembershipForCurrentUserRequest request
    )
    {
        var data = await _userMembershipService.CreateForCurrentUserAsync(request);
        return ApiResponse<CreateUserMembershipResponse>.SuccessResponse(
            data,
            "Đăng ký gói hội viên thành công"
        );
    }

    [HttpPut("update-status")]
    public async Task<ApiResponse<object?>> UpdateStatus(
        [FromBody] UpdateUserMembershipStatusRequest request
    )
    {
        await _userMembershipService.UpdateStatusAsync(request);
        return ApiResponse<object?>.SuccessResponse(
            null,
            "Cập nhật trạng thái hội viên thành công"
        );
    }

    [HttpDelete("delete")]
    public async Task<ApiResponse<object?>> Delete([FromQuery] int id)
    {
        await _userMembershipService.DeleteAsync(id);
        return ApiResponse<object?>.SuccessResponse(
            null,
            "Xóa thông tin hội viên khách hàng thành công"
        );
    }

    [HttpPost("extend-payment")]
    public async Task<ApiResponse<CreateUserMembershipResponse>> ExtendPayment(
        [FromBody] ExtendPaymentRequest request
    )
    {
        var data = await _userMembershipService.ExtendPaymentAsync(request);
        return ApiResponse<CreateUserMembershipResponse>.SuccessResponse(
            data,
            "Gia hạn thanh toán thành công"
        );
    }
}

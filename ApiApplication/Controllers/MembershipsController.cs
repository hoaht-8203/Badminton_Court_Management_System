using ApiApplication.Dtos;
using ApiApplication.Dtos.Membership;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MembershipsController(IMembershipService membershipService) : ControllerBase
{
    private readonly IMembershipService _membershipService = membershipService;

    [HttpGet("list")]
    public async Task<ApiResponse<ListMembershipResponse[]>> List(
        [FromQuery] ListMembershipRequest request
    )
    {
        var data = await _membershipService.ListAsync(request);
        return ApiResponse<ListMembershipResponse[]>.SuccessResponse(data.ToArray());
    }

    [HttpGet("detail")]
    public async Task<ApiResponse<DetailMembershipResponse>> Detail(
        [FromQuery] DetailMembershipRequest request
    )
    {
        var data = await _membershipService.DetailAsync(request.Id);
        return ApiResponse<DetailMembershipResponse>.SuccessResponse(data);
    }

    [HttpPost("create")]
    public async Task<ApiResponse<object?>> Create([FromBody] CreateMembershipRequest request)
    {
        await _membershipService.CreateAsync(request);
        return ApiResponse<object?>.SuccessResponse(null, "Tạo gói hội viên thành công");
    }

    [HttpPut("update")]
    public async Task<ApiResponse<object?>> Update([FromBody] UpdateMembershipRequest request)
    {
        await _membershipService.UpdateAsync(request);
        return ApiResponse<object?>.SuccessResponse(null, "Cập nhật gói hội viên thành công");
    }

    [HttpDelete("delete")]
    public async Task<ApiResponse<object?>> Delete([FromQuery] DeleteMembershipRequest request)
    {
        await _membershipService.DeleteAsync(request);
        return ApiResponse<object?>.SuccessResponse(null, "Xóa gói hội viên thành công");
    }

    [HttpPut("update-status")]
    public async Task<ApiResponse<object?>> UpdateStatus(
        [FromBody] UpdateMemberShipStatusRequest request
    )
    {
        await _membershipService.UpdateStatusAsync(request);
        return ApiResponse<object?>.SuccessResponse(
            null,
            "Cập nhật trạng thái gói hội viên thành công"
        );
    }
}

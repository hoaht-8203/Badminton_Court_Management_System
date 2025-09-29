using ApiApplication.Dtos;
using ApiApplication.Dtos.User;
using ApiApplication.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController(IUserService userService) : ControllerBase
    {
        private readonly IUserService _userService = userService;

        [HttpPost("change-user-status")]
        public async Task<ActionResult<ApiResponse<object?>>> ChangeUserStatus(
            ChangeUserStatusRequest changeUserStatusRequest
        )
        {
            await _userService.ChangeUserStatusAsync(changeUserStatusRequest);
            return Ok(
                ApiResponse<object?>.SuccessResponse(null, "Change user status successfully")
            );
        }

        [HttpGet("list-administrator")]
        public async Task<
            ActionResult<ApiResponse<List<ListAdministratorResponse>>>
        > ListAdministrator([FromQuery] ListAdministratorRequest listAdministratorRequest)
        {
            var result = await _userService.ListAdministratorAsync(listAdministratorRequest);
            return Ok(
                ApiResponse<List<ListAdministratorResponse>>.SuccessResponse(
                    result,
                    "Get list administrator successfully"
                )
            );
        }

        [HttpGet("detail-administrator")]
        public async Task<
            ActionResult<ApiResponse<DetailAdministratorResponse>>
        > DetailAdministrator([FromQuery] DetailAdministratorRequest detailAdministratorRequest)
        {
            var result = await _userService.DetailAdministratorAsync(detailAdministratorRequest);
            return Ok(
                ApiResponse<DetailAdministratorResponse>.SuccessResponse(
                    result,
                    "Get detail administrator successfully"
                )
            );
        }

        [HttpPost("create-administrator")]
        public async Task<ActionResult<ApiResponse<object?>>> Register(
            CreateAdministratorRequest createAdministratorRequest
        )
        {
            await _userService.CreateAdministratorAsync(createAdministratorRequest);
            return Ok(
                ApiResponse<object?>.SuccessResponse(null, "Create administrator successfully")
            );
        }

        [HttpPut("update-administrator")]
        public async Task<ActionResult<ApiResponse<object?>>> UpdateUser(
            UpdateUserRequest updateUserRequest
        )
        {
            await _userService.UpdateUserAsync(updateUserRequest);
            return Ok(
                ApiResponse<object?>.SuccessResponse(null, "Update administrator successfully")
            );
        }

        [HttpPut("update-user-roles")]
        public async Task<ActionResult<ApiResponse<object?>>> UpdateUserRoles(
            UpdateUserRolesRequest request
        )
        {
            await _userService.UpdateUserRolesAsync(request);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Update user roles successfully"));
        }

        [HttpGet("list-user-roles")]
        public async Task<ActionResult<ApiResponse<List<ListUserRoleItemResponse>>>> ListUserRoles(
            [FromQuery] ListUserRolesRequest request
        )
        {
            var result = await _userService.ListUserRolesAsync(request);
            return Ok(
                ApiResponse<List<ListUserRoleItemResponse>>.SuccessResponse(
                    result,
                    "Get list user roles successfully"
                )
            );
        }
    }
}

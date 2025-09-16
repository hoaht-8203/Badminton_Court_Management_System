using ApiApplication.Dtos;
using ApiApplication.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RolesController(IRoleService roleService) : ControllerBase
    {
        private readonly IRoleService _roleService = roleService;

        [HttpGet("list")]
        public async Task<ActionResult<ApiResponse<List<ListRoleResponse>>>> ListRole(
            [FromQuery] ListRoleRequest listRoleRequest
        )
        {
            var result = await _roleService.ListRoleAsync(listRoleRequest);
            return Ok(
                ApiResponse<List<ListRoleResponse>>.SuccessResponse(
                    result,
                    "List role successfully"
                )
            );
        }

        [HttpGet("detail")]
        public async Task<ActionResult<ApiResponse<DetailRoleResponse>>> DetailRole(
            [FromQuery] DetailRoleRequest detailRoleRequest
        )
        {
            var result = await _roleService.DetailRoleAsync(detailRoleRequest);
            return Ok(
                ApiResponse<DetailRoleResponse>.SuccessResponse(result, "Detail role successfully")
            );
        }

        [HttpPost("create")]
        public async Task<ActionResult<ApiResponse<object?>>> CreateRole(
            CreateRoleRequest createRoleRequest
        )
        {
            await _roleService.CreateRoleAsync(createRoleRequest);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Create role successfully"));
        }

        [HttpPut("update")]
        public async Task<ActionResult<ApiResponse<object?>>> UpdateRole(
            UpdateRoleRequest updateRoleRequest
        )
        {
            await _roleService.UpdateRoleAsync(updateRoleRequest);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Update role successfully"));
        }

        [HttpDelete("delete")]
        public async Task<ActionResult<ApiResponse<object?>>> DeleteRole(
            DeleteRoleRequest deleteRoleRequest
        )
        {
            await _roleService.DeleteRoleAsync(deleteRoleRequest);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Delete role successfully"));
        }
    }
}

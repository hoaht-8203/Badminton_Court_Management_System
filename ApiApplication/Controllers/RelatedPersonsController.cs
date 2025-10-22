using ApiApplication.Dtos;
using ApiApplication.Dtos.RelationPerson;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RelatedPersonsController(IRelatedPersonService relatedPersonService) : ControllerBase
{
    private readonly IRelatedPersonService _service = relatedPersonService;

    [HttpGet("list")]
    public async Task<ApiResponse<RelatedPersonResponse[]>> List([FromQuery] ListRelatedPersonRequest request)
    {
        var data = await _service.ListAsync(request);
        return ApiResponse<RelatedPersonResponse[]>.SuccessResponse(data);
    }

    [HttpGet("detail")]
    public async Task<ApiResponse<RelatedPersonResponse>> Detail([FromQuery] DetailRelatedPersonRequest request)
    {
        var item = await _service.DetailAsync(request);
        return ApiResponse<RelatedPersonResponse>.SuccessResponse(item!);
    }

    [HttpPost("create")]
    public async Task<ApiResponse<object?>> Create([FromBody] CreateRelatedPersonRequest request)
    {
        var id = await _service.CreateAsync(request);
        return ApiResponse<object?>.SuccessResponse(new { id }, "Tạo người liên quan thành công");
    }

    [HttpPut("update")]
    public async Task<ApiResponse<object?>> Update([FromBody] UpdateRelatedPersonRequest request)
    {
        await _service.UpdateAsync(request);
        return ApiResponse<object?>.SuccessResponse(null, "Cập nhật người liên quan thành công");
    }

    [HttpDelete("delete/{id}")]
    public async Task<ApiResponse<object?>> Delete([FromRoute] int id)
    {
        await _service.DeleteAsync(id);
        return ApiResponse<object?>.SuccessResponse(null, "Xóa người liên quan thành công");
    }
}

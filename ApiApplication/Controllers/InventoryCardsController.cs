using ApiApplication.Dtos;
using ApiApplication.Dtos.InventoryCard;
using Microsoft.AspNetCore.Mvc;
using ApiApplication.Services;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
public class InventoryCardsController(IInventoryCardService service) : ControllerBase
{
    private readonly IInventoryCardService _service = service;

    // DTO moved to Dtos/InventoryCard/ListByProductResponse.cs

    [HttpGet("list-by-product")]
    public async Task<ActionResult<ApiResponse<List<ListByProductResponse>>>> ListByProduct([FromQuery] int productId)
    {
        var list = await _service.ListByProductAsync(productId);
        return Ok(ApiResponse<List<ListByProductResponse>>.SuccessResponse(list, "Lấy thẻ kho theo sản phẩm thành công"));
    }
}



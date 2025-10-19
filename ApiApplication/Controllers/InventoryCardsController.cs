using ApiApplication.Dtos;
using ApiApplication.Dtos.InventoryCard;
using ApiApplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
public class InventoryCardsController(IInventoryCardService service) : ControllerBase
{
    private readonly IInventoryCardService _service = service;

    // DTO moved to Dtos/InventoryCard/ListByProductResponse.cs

    [HttpGet("list-by-product")]
    public async Task<ActionResult<ApiResponse<List<ListByProductResponse>>>> ListByProduct(
        [FromQuery] int productId
    )
    {
        var list = await _service.ListByProductAsync(productId);
        return Ok(
            ApiResponse<List<ListByProductResponse>>.SuccessResponse(
                list,
                "Lấy thẻ kho theo sản phẩm thành công"
            )
        );
    }

    [HttpPost("create")]
    public async Task<ActionResult<ApiResponse<UpdateInventoryCardResponse>>> Create(
        [FromBody] CreateInventoryCardRequest request
    )
    {
        var generatedCode = await _service.GenerateNextSaleInventoryCardCodeAsync();

        var costPrice = await _service.GetProductCostPriceAsync(request.ProductId);

        var updateRequest = new UpdateInventoryCardRequest
        {
            ProductId = request.ProductId,
            Code = generatedCode,
            Method = "Bán hàng",
            OccurredAt = DateTime.UtcNow,
            CostPrice = costPrice,
            QuantityChange = -Math.Abs(request.QuantityChange),
            Note = request.Note,
            UpdateProductStock = request.UpdateProductStock,
        };

        var result = await _service.UpdateInventoryCardAsync(updateRequest);
        return Ok(
            ApiResponse<UpdateInventoryCardResponse>.SuccessResponse(
                result,
                "Tạo thẻ kho và cập nhật tồn kho thành công"
            )
        );
    }
}

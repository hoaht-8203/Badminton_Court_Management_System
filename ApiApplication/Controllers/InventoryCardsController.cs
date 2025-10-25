using ApiApplication.Dtos;
using ApiApplication.Dtos.InventoryCard;
using ApiApplication.Services;
using ApiApplication.Exceptions;
using Microsoft.AspNetCore.Mvc;
using System.Net;

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
        try
        {
            if (productId <= 0)
            {
                throw new ApiException("Mã sản phẩm không hợp lệ", HttpStatusCode.BadRequest);
            }
            
            var list = await _service.ListByProductAsync(productId);
            
            if (list == null || !list.Any())
            {
                throw new ApiException("Không tìm thấy thẻ kho cho sản phẩm này", HttpStatusCode.NotFound);
            }
            
            return Ok(
                ApiResponse<List<ListByProductResponse>>.SuccessResponse(
                    list,
                    "Lấy thẻ kho theo sản phẩm thành công"
                )
            );
        }
        catch (ApiException ex)
        {
            return StatusCode((int)ex.StatusCode, 
                ApiResponse<List<ListByProductResponse>>.ErrorResponse(ex.Message, ex.Errors));
        }
        catch (Exception)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, 
                ApiResponse<List<ListByProductResponse>>.ErrorResponse("Lỗi khi lấy thẻ kho theo sản phẩm"));
        }
    }

    [HttpPost("create")]
    public async Task<ActionResult<ApiResponse<UpdateInventoryCardResponse>>> Create(
        [FromBody] CreateInventoryCardRequest request
    )
    {
        try
        {
            if (request == null)
            {
                throw new ApiException("Dữ liệu yêu cầu không hợp lệ", HttpStatusCode.BadRequest);
            }

            if (request.ProductId <= 0)
            {
                throw new ApiException("Mã sản phẩm không hợp lệ", HttpStatusCode.BadRequest);
            }

            if (request.QuantityChange <= 0)
            {
                throw new ApiException("Số lượng thay đổi phải lớn hơn 0", HttpStatusCode.BadRequest);
            }

            var generatedCode = await _service.GenerateNextSaleInventoryCardCodeAsync();
            if (string.IsNullOrEmpty(generatedCode))
            {
                throw new ApiException("Không thể tạo mã thẻ kho", HttpStatusCode.InternalServerError);
            }

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
            
            if (result == null)
            {
                throw new ApiException("Không thể cập nhật thẻ kho", HttpStatusCode.InternalServerError);
            }

            return Ok(
                ApiResponse<UpdateInventoryCardResponse>.SuccessResponse(
                    result,
                    "Tạo thẻ kho và cập nhật tồn kho thành công"
                )
            );
        }
        catch (ApiException ex)
        {
            return StatusCode((int)ex.StatusCode, 
                ApiResponse<UpdateInventoryCardResponse>.ErrorResponse(ex.Message, ex.Errors));
        }
        catch (Exception)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, 
                ApiResponse<UpdateInventoryCardResponse>.ErrorResponse("Lỗi khi tạo thẻ kho"));
        }
    }
}

using ApiApplication.Data;
using ApiApplication.Dtos.InventoryCard;
using ApiApplication.Entities;
using ApiApplication.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class InventoryCardService(ApplicationDbContext context) : IInventoryCardService
{
    private readonly ApplicationDbContext _context = context;

    public async Task<List<ListByProductResponse>> ListByProductAsync(int productId)
    {
        return await _context
            .InventoryCards.Where(x => x.ProductId == productId)
            .OrderByDescending(x => x.OccurredAt)
            .Select(x => new ListByProductResponse
            {
                Code = x.Code,
                Method = x.Method,
                OccurredAt = x.OccurredAt,
                CostPrice = x.CostPrice,
                QuantityChange = x.QuantityChange,
                EndingStock = x.EndingStock,
            })
            .ToListAsync();
    }

    public async Task<string> GenerateNextInventoryCardCodeAsync()
    {
        var lastCode = await _context
            .InventoryCards.Where(x => x.Code.StartsWith("TC"))
            .OrderByDescending(x => x.Code)
            .Select(x => x.Code)
            .FirstOrDefaultAsync();

        if (string.IsNullOrEmpty(lastCode))
            return "TC000001";

        var numberPart = lastCode.Substring(2);
        if (int.TryParse(numberPart, out var number))
        {
            return $"TC{(number + 1):D6}";
        }

        return "TC000001";
    }

    public async Task<string> GenerateNextSaleInventoryCardCodeAsync()
    {
        // Sử dụng cùng mã TC cho tất cả loại giao dịch
        return await GenerateNextInventoryCardCodeAsync();
    }

    public async Task<decimal> GetProductCostPriceAsync(int productId)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null)
        {
            throw new ApiException(
                $"Sản phẩm không tồn tại: {productId}",
                System.Net.HttpStatusCode.NotFound
            );
        }

        return product.CostPrice;
    }

    public async Task<UpdateInventoryCardResponse> UpdateInventoryCardAsync(UpdateInventoryCardRequest request)
    {
        // Kiểm tra sản phẩm có tồn tại không
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == request.ProductId);

        if (product == null)
        {
            throw new ApiException(
                $"Sản phẩm không tồn tại: {request.ProductId}",
                System.Net.HttpStatusCode.NotFound
            );
        }

        // Kiểm tra sản phẩm có quản lý tồn kho không
        if (!product.ManageInventory)
        {
            throw new ApiException(
                $"Sản phẩm không quản lý tồn kho: {product.Name}",
                System.Net.HttpStatusCode.BadRequest
            );
        }

        // Lưu tồn kho hiện tại để tính toán
        var currentStock = product.Stock;
        var newStock = currentStock;

        // Nếu cần cập nhật tồn kho sản phẩm
        if (request.UpdateProductStock)
        {
            // Tính toán tồn kho mới
            newStock = currentStock + request.QuantityChange;

            // Kiểm tra tồn kho âm (chỉ khi bán hàng - quantityChange < 0)
            if (newStock < 0)
            {
                throw new ApiException(
                    $"Không đủ tồn kho để bán. Tồn hiện tại: {currentStock}, Cần bán: {Math.Abs(request.QuantityChange)}",
                    System.Net.HttpStatusCode.BadRequest
                );
            }
        }

        try
        {
            // Tạo thẻ kho mới
            var inventoryCard = new InventoryCard
            {
                ProductId = request.ProductId,
                Code = request.Code ?? string.Empty,
                Method = request.Method ?? string.Empty,
                OccurredAt = request.OccurredAt,
                CostPrice = request.CostPrice,
                QuantityChange = request.QuantityChange,
                EndingStock = newStock // Tồn kho sau khi thay đổi
            };

            _context.InventoryCards.Add(inventoryCard);

            // Cập nhật tồn kho sản phẩm nếu được yêu cầu
            if (request.UpdateProductStock)
            {
                product.Stock = newStock;
            }

            await _context.SaveChangesAsync();

            // Trả về response
            return new UpdateInventoryCardResponse
            {
                Id = inventoryCard.Id,
                ProductId = product.Id,
                ProductName = product.Name,
                Code = inventoryCard.Code ?? string.Empty,
                Method = inventoryCard.Method ?? string.Empty,
                OccurredAt = inventoryCard.OccurredAt,
                CostPrice = inventoryCard.CostPrice,
                QuantityChange = inventoryCard.QuantityChange,
                EndingStock = inventoryCard.EndingStock,
                Note = request.Note
            };
        }
        catch (DbUpdateException ex)
        {
            var msg = ex.InnerException?.Message ?? ex.Message;
            throw new ApiException(
                $"Cập nhật thẻ kho thất bại: {msg}",
                System.Net.HttpStatusCode.BadRequest
            );
        }
        catch (Exception ex)
        {
            throw new ApiException(
                $"Cập nhật thẻ kho thất bại: {ex.Message}",
                System.Net.HttpStatusCode.BadRequest
            );
        }
    }

    
    public async Task<UpdateInventoryCardResponse> CreateInventoryCardForSaleAsync(CreateInventoryCardForSaleRequest request)
    {
        var updateRequest = new UpdateInventoryCardRequest
        {
            ProductId = request.ProductId,
            Code = request.Code,
            Method = request.Method,
            OccurredAt = request.OccurredAt,
            CostPrice = request.CostPrice,
            QuantityChange = -request.QuantitySold, // Chuyển thành số âm để trừ tồn kho
            Note = request.Note,
            UpdateProductStock = request.UpdateProductStock
        };

        return await UpdateInventoryCardAsync(updateRequest);
    }

    // Tạo thẻ kho khi nhập hàng (cộng tồn kho)
    public async Task<UpdateInventoryCardResponse> CreateInventoryCardForPurchaseAsync(CreateInventoryCardForPurchaseRequest request)
    {
        var updateRequest = new UpdateInventoryCardRequest
        {
            ProductId = request.ProductId,
            Code = request.Code,
            Method = request.Method,
            OccurredAt = request.OccurredAt,
            CostPrice = request.CostPrice,
            QuantityChange = request.QuantityPurchased, // Số dương để cộng tồn kho
            Note = request.Note,
            UpdateProductStock = request.UpdateProductStock
        };

        return await UpdateInventoryCardAsync(updateRequest);
    }
}

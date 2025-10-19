using ApiApplication.Dtos.InventoryCard;

namespace ApiApplication.Services;

public interface IInventoryCardService
{
    Task<List<ListByProductResponse>> ListByProductAsync(int productId);
    Task<string> GenerateNextInventoryCardCodeAsync();
    Task<string> GenerateNextSaleInventoryCardCodeAsync();
    Task<decimal> GetProductCostPriceAsync(int productId);
    Task<UpdateInventoryCardResponse> UpdateInventoryCardAsync(UpdateInventoryCardRequest request);

    // Helper methods cho các trường hợp cụ thể
    Task<UpdateInventoryCardResponse> CreateInventoryCardForSaleAsync(
        CreateInventoryCardForSaleRequest request
    );
    Task<UpdateInventoryCardResponse> CreateInventoryCardForPurchaseAsync(
        CreateInventoryCardForPurchaseRequest request
    );
}

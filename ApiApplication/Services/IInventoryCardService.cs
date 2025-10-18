using ApiApplication.Dtos.InventoryCard;

namespace ApiApplication.Services;

public interface IInventoryCardService
{
    Task<List<ListByProductResponse>> ListByProductAsync(int productId);
    Task<string> GenerateNextInventoryCardCodeAsync();
}

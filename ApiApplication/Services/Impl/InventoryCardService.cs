using ApiApplication.Data;
using ApiApplication.Dtos.InventoryCard;
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
}

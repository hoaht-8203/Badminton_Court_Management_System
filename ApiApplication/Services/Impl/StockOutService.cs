using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Dtos.StockOut;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Services;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl
{
    public class StockOutService : IStockOutService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IInventoryCardService _inventoryCardService;

        public StockOutService(
            ApplicationDbContext context,
            IMapper mapper,
            IInventoryCardService inventoryCardService
        )
        {
            _context = context;
            _mapper = mapper;
            _inventoryCardService = inventoryCardService;
        }

        public async Task<List<ListStockOutResponse>> ListAsync(
            DateTime? from,
            DateTime? to,
            int? status
        )
        {
            var query = _context.StockOuts.Include(s => s.Supplier).AsQueryable();

            if (from.HasValue)
            {
                query = query.Where(x => x.OutTime >= from.Value);
            }

            if (to.HasValue)
            {
                query = query.Where(x => x.OutTime <= to.Value);
            }

            if (status.HasValue)
            {
                query = query.Where(x => (int)x.Status == status.Value);
            }

            var stockOuts = await query
                .OrderByDescending(x => x.OutTime)
                .Select(s => new ListStockOutResponse
                {
                    Id = s.Id,
                    Code = s.Code,
                    OutTime = s.OutTime,
                    SupplierId = s.SupplierId,
                    SupplierName = s.Supplier.Name,
                    OutBy = s.OutBy,
                    TotalValue = s.TotalValue,
                    Note = s.Note,
                    Status = (int)s.Status,
                })
                .ToListAsync();

            return stockOuts;
        }

        public async Task<DetailStockOutResponse> DetailAsync(int id)
        {
            var stockOut = await _context
                .StockOuts.Include(x => x.Supplier)
                .Include(x => x.Items)
                .ThenInclude(x => x.Product)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (stockOut == null)
                throw new ArgumentException("Stock out not found");

            return new DetailStockOutResponse
            {
                Id = stockOut.Id,
                Code = stockOut.Code,
                OutTime = stockOut.OutTime,
                SupplierId = stockOut.SupplierId,
                SupplierName = stockOut.Supplier.Name,
                OutBy = stockOut.OutBy,
                CreatedBy = stockOut.CreatedBy,
                TotalValue = stockOut.TotalValue,
                Note = stockOut.Note,
                Status = (int)stockOut.Status,
                Items = stockOut
                    .Items.Select(i => new DetailStockOutItem
                    {
                        ProductId = i.ProductId,
                        ProductCode = i.Product.Code,
                        ProductName = i.Product.Name,
                        Quantity = i.Quantity,
                        CostPrice = i.CostPrice,
                        Note = i.Note,
                    })
                    .ToList(),
            };
        }

        public async Task<int> CreateAsync(CreateStockOutRequest request)
        {
            var stockOut = _mapper.Map<StockOut>(request);

            // Enforce true UTC for timestamptz
            stockOut.OutTime =
                request.OutTime.Kind == DateTimeKind.Utc
                    ? request.OutTime
                    : request.OutTime.ToUniversalTime();

            stockOut.Code = await GenerateNextStockOutCodeAsync();
            stockOut.CreatedAt = DateTime.UtcNow;
            stockOut.UpdatedAt = DateTime.UtcNow;

            // Calculate total value
            var totalValue = request.Items.Sum(x => x.Quantity * x.CostPrice);
            stockOut.TotalValue = totalValue;

            // Add items
            stockOut.Items.Clear();
            foreach (var itemRequest in request.Items)
            {
                var item = _mapper.Map<StockOutItem>(itemRequest);
                stockOut.Items.Add(item);
            }

            _context.StockOuts.Add(stockOut);
            await _context.SaveChangesAsync();

            // If completed, update stock and create inventory cards
            if (request.Complete)
            {
                await ProcessStockOutCompletion(stockOut);
            }

            return stockOut.Id;
        }

        public async Task UpdateAsync(int id, CreateStockOutRequest request)
        {
            var stockOut = await _context
                .StockOuts.Include(x => x.Items)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (stockOut == null)
                throw new ArgumentException("Stock out not found");

            if (stockOut.Status != StockOutStatus.Draft)
                throw new InvalidOperationException("Only draft stock outs can be updated");

            // Update basic properties (ensure UTC)
            stockOut.OutTime =
                request.OutTime.Kind == DateTimeKind.Utc
                    ? request.OutTime
                    : request.OutTime.ToUniversalTime();
            stockOut.SupplierId = request.SupplierId;
            stockOut.OutBy = request.OutBy;
            stockOut.Note = request.Note;
            stockOut.UpdatedAt = DateTime.UtcNow;

            // Update items
            stockOut.Items.Clear();
            foreach (var itemRequest in request.Items)
            {
                var item = _mapper.Map<StockOutItem>(itemRequest);
                stockOut.Items.Add(item);
            }

            // Recalculate total value
            var totalValue = request.Items.Sum(x => x.Quantity * x.CostPrice);
            stockOut.TotalValue = totalValue;

            await _context.SaveChangesAsync();
        }

        public async Task CompleteAsync(int id)
        {
            var stockOut = await _context
                .StockOuts.Include(x => x.Items)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (stockOut == null)
                throw new ArgumentException("Stock out not found");

            if (stockOut.Status != StockOutStatus.Draft)
                throw new InvalidOperationException("Only draft stock outs can be completed");

            stockOut.Status = StockOutStatus.Completed;
            stockOut.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Process completion
            await ProcessStockOutCompletion(stockOut);
        }

        public async Task CancelAsync(int id)
        {
            var stockOut = await _context.StockOuts.FindAsync(id);

            if (stockOut == null)
                throw new ArgumentException("Stock out not found");

            if (stockOut.Status != StockOutStatus.Draft)
                throw new InvalidOperationException("Only draft stock outs can be cancelled");

            stockOut.Status = StockOutStatus.Cancelled;
            stockOut.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        private async Task ProcessStockOutCompletion(StockOut stockOut)
        {
            foreach (var item in stockOut.Items)
            {
                // Update product stock (reduce quantity)
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product != null)
                {
                    product.Stock = Math.Max(0, product.Stock - item.Quantity);
                    product.UpdatedAt = DateTime.UtcNow;
                }

                // Create inventory card for stock out
                var inventoryCard = new InventoryCard
                {
                    Code = await _inventoryCardService.GenerateNextInventoryCardCodeAsync(),
                    ProductId = item.ProductId,
                    Method = "Xuất hủy",
                    QuantityChange = -item.Quantity, // Negative quantity for stock out
                    CostPrice = item.CostPrice,
                    OccurredAt = DateTime.UtcNow,
                    EndingStock = product?.Stock ?? 0,
                };

                _context.InventoryCards.Add(inventoryCard);
            }

            await _context.SaveChangesAsync();

            // Create inventory check
            var inventoryCheck = new InventoryCheck
            {
                Code = await GenerateNextInventoryCheckCodeAsync(),
                CheckTime = DateTime.UtcNow,
                Note = $"Phiếu tự động - Xuất hủy {stockOut.Code}",
                Status = InventoryCheckStatus.Balanced,
                BalancedAt = DateTime.UtcNow,
                IsAutoGenerated = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            // Add inventory check items
            foreach (var item in stockOut.Items)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                var inventoryCheckItem = new InventoryCheckItem
                {
                    ProductId = item.ProductId,
                    SystemQuantity = product?.Stock ?? 0,
                    ActualQuantity = product?.Stock ?? 0,
                };
                inventoryCheck.Items.Add(inventoryCheckItem);
            }

            _context.InventoryChecks.Add(inventoryCheck);
            await _context.SaveChangesAsync();
        }

        private async Task<string> GenerateNextStockOutCodeAsync()
        {
            var lastCode = await _context
                .StockOuts.Where(x => x.Code.StartsWith("XH"))
                .OrderByDescending(x => x.Code)
                .Select(x => x.Code)
                .FirstOrDefaultAsync();

            if (string.IsNullOrEmpty(lastCode))
                return "XH000001";

            var numberPart = lastCode.Substring(2);
            if (int.TryParse(numberPart, out var number))
            {
                return $"XH{(number + 1):D6}";
            }

            return "XH000001";
        }

        private async Task<string> GenerateNextInventoryCheckCodeAsync()
        {
            var lastCode = await _context
                .InventoryChecks.Where(x => x.Code.StartsWith("KK"))
                .OrderByDescending(x => x.Code)
                .Select(x => x.Code)
                .FirstOrDefaultAsync();

            if (string.IsNullOrEmpty(lastCode))
                return "KK000001";

            var numberPart = lastCode.Substring(2);
            if (int.TryParse(numberPart, out var number))
            {
                return $"KK{(number + 1):D6}";
            }

            return "KK000001";
        }
    }
}

using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Dtos.ReturnGoods;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Enums;
using ApiApplication.Exceptions;
using ApiApplication.Sessions;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl
{
    public class ReturnGoodsService : IReturnGoodsService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUser _currentUser;

        public ReturnGoodsService(ApplicationDbContext context, ICurrentUser currentUser)
        {
            _context = context;
            _currentUser = currentUser;
        }

        public async Task<List<ListReturnGoodsResponse>> ListAsync(DateTime? from, DateTime? to, int? status)
        {
            var query = _context.ReturnGoods.Include(r => r.Supplier).AsQueryable();

            if (from.HasValue)
            {
                query = query.Where(x => x.ReturnTime >= from.Value);
            }

            if (to.HasValue)
            {
                query = query.Where(x => x.ReturnTime <= to.Value);
            }

            if (status.HasValue)
            {
                query = query.Where(x => (int)x.Status == status.Value);
            }

            var returnGoods = await query
                .OrderByDescending(x => x.ReturnTime)
                .Select(r => new ListReturnGoodsResponse
                {
                    Id = r.Id,
                    Code = r.Code,
                    ReturnTime = r.ReturnTime,
                    SupplierId = r.SupplierId,
                    SupplierName = r.Supplier.Name,
                    ReturnBy = r.ReturnBy,
                    TotalValue = r.TotalValue,
                    Discount = r.Discount,
                    SupplierNeedToPay = r.SupplierNeedToPay,
                    SupplierPaid = r.SupplierPaid,
                    Note = r.Note,
                    Status = (int)r.Status
                })
                .ToListAsync();

            return returnGoods;
        }

        public async Task<DetailReturnGoodsResponse> DetailAsync(int id)
        {
            var returnGoods = await _context.ReturnGoods
                .Include(x => x.Supplier)
                .Include(x => x.Items)
                .ThenInclude(x => x.Product)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (returnGoods == null)
            {
                throw new ApiException("Không tìm thấy phiếu trả hàng");
            }

            return new DetailReturnGoodsResponse
            {
                Id = returnGoods.Id,
                Code = returnGoods.Code,
                ReturnTime = returnGoods.ReturnTime,
                SupplierId = returnGoods.SupplierId,
                SupplierName = returnGoods.Supplier.Name,
                ReturnBy = returnGoods.ReturnBy,
                CreatedBy = returnGoods.CreatedBy,
                TotalValue = returnGoods.TotalValue,
                Discount = returnGoods.Discount,
                SupplierNeedToPay = returnGoods.SupplierNeedToPay,
                SupplierPaid = returnGoods.SupplierPaid,
                Note = returnGoods.Note,
                Status = (int)returnGoods.Status,
                Items = returnGoods.Items.Select(i => new DetailReturnGoodsItem
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    ProductCode = i.Product.Code,
                    ProductName = i.Product.Name,
                    Quantity = i.Quantity,
                    ImportPrice = i.ImportPrice,
                    ReturnPrice = i.ReturnPrice,
                    Discount = i.Discount,
                    LineTotal = i.LineTotal,
                    Note = i.Note
                }).ToList()
            };
        }

        public async Task<int> CreateAsync(CreateReturnGoodsRequest request)
        {
            var code = await GenerateCodeAsync();

            var returnGoods = new ReturnGoods
            {
                Code = code,
                ReturnTime = request.ReturnTime.Kind == DateTimeKind.Utc
                    ? request.ReturnTime
                    : request.ReturnTime.ToUniversalTime(),
                SupplierId = request.SupplierId,
                ReturnBy = request.ReturnBy,
                Note = request.Note,
                Discount = request.Discount,
                SupplierPaid = request.SupplierPaid,
                Status = request.Complete ? ReturnGoodsStatus.Completed : ReturnGoodsStatus.Draft,
                CreatedBy = _currentUser.Username,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Calculate totals
            decimal totalValue = 0;
            foreach (var item in request.Items)
            {
                var lineTotal = (item.Quantity * item.ReturnPrice) - item.Discount;
                totalValue += lineTotal;

                returnGoods.Items.Add(new ReturnGoodsItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    ImportPrice = item.ImportPrice,
                    ReturnPrice = item.ReturnPrice,
                    Discount = item.Discount,
                    LineTotal = lineTotal,
                    Note = item.Note,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            returnGoods.TotalValue = totalValue;
            returnGoods.SupplierNeedToPay = totalValue - request.Discount;

            _context.ReturnGoods.Add(returnGoods);

            if (request.Complete)
            {
                await ProcessReturnGoodsAsync(returnGoods);
            }

            await _context.SaveChangesAsync();
            return returnGoods.Id;
        }

        public async Task UpdateAsync(int id, CreateReturnGoodsRequest request)
        {
            var returnGoods = await _context.ReturnGoods
                .Include(x => x.Items)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (returnGoods == null)
            {
                throw new ApiException("Không tìm thấy phiếu trả hàng");
            }

            if (returnGoods.Status != ReturnGoodsStatus.Draft)
            {
                throw new ApiException("Chỉ có thể chỉnh sửa phiếu nháp");
            }

            returnGoods.ReturnTime = request.ReturnTime.Kind == DateTimeKind.Utc
                ? request.ReturnTime
                : request.ReturnTime.ToUniversalTime();
            returnGoods.SupplierId = request.SupplierId;
            returnGoods.ReturnBy = request.ReturnBy;
            returnGoods.Note = request.Note;
            returnGoods.Discount = request.Discount;
            returnGoods.SupplierPaid = request.SupplierPaid;
            returnGoods.UpdatedAt = DateTime.UtcNow;

            // Remove existing items
            _context.ReturnGoodsItems.RemoveRange(returnGoods.Items);
            returnGoods.Items.Clear();

            // Add new items
            decimal totalValue = 0;
            foreach (var item in request.Items)
            {
                var lineTotal = (item.Quantity * item.ReturnPrice) - item.Discount;
                totalValue += lineTotal;

                returnGoods.Items.Add(new ReturnGoodsItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    ImportPrice = item.ImportPrice,
                    ReturnPrice = item.ReturnPrice,
                    Discount = item.Discount,
                    LineTotal = lineTotal,
                    Note = item.Note,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            returnGoods.TotalValue = totalValue;
            returnGoods.SupplierNeedToPay = totalValue - request.Discount;

            await _context.SaveChangesAsync();
        }

        public async Task CompleteAsync(int id)
        {
            var returnGoods = await _context.ReturnGoods
                .Include(x => x.Items)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (returnGoods == null)
            {
                throw new ApiException("Không tìm thấy phiếu trả hàng");
            }

            if (returnGoods.Status != ReturnGoodsStatus.Draft)
            {
                throw new ApiException("Chỉ có thể hoàn thành phiếu nháp");
            }

            returnGoods.Status = ReturnGoodsStatus.Completed;
            returnGoods.UpdatedAt = DateTime.UtcNow;

            await ProcessReturnGoodsAsync(returnGoods);
            await _context.SaveChangesAsync();
        }

        public async Task CancelAsync(int id)
        {
            var returnGoods = await _context.ReturnGoods.FirstOrDefaultAsync(x => x.Id == id);

            if (returnGoods == null)
            {
                throw new ApiException("Không tìm thấy phiếu trả hàng");
            }

            if (returnGoods.Status == ReturnGoodsStatus.Cancelled)
            {
                throw new ApiException("Phiếu đã bị hủy");
            }

            returnGoods.Status = ReturnGoodsStatus.Cancelled;
            returnGoods.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        private async Task<string> GenerateCodeAsync()
        {
            var today = DateTime.UtcNow.Date;
            var count = await _context.ReturnGoods
                .Where(x => x.CreatedAt >= today)
                .CountAsync();

            return $"THN{(count + 1):D6}";
        }

        private async Task ProcessReturnGoodsAsync(ReturnGoods returnGoods)
        {
            foreach (var item in returnGoods.Items)
            {
                // Create inventory card for return goods
                var inventoryCard = new InventoryCard
                {
                    ProductId = item.ProductId,
                    Code = returnGoods.Code,
                    Method = "Trả hàng nhà cung cấp",
                    OccurredAt = returnGoods.ReturnTime,
                    CostPrice = item.ReturnPrice,
                    QuantityChange = -item.Quantity, // Negative quantity for return
                    EndingStock = 0, // Will be calculated
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Calculate final inventory
                var lastCard = await _context.InventoryCards
                    .Where(x => x.ProductId == item.ProductId)
                    .OrderByDescending(x => x.OccurredAt)
                    .FirstOrDefaultAsync();

                inventoryCard.EndingStock = (lastCard?.EndingStock ?? 0) + inventoryCard.QuantityChange;

                _context.InventoryCards.Add(inventoryCard);

                // Update product stock
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product != null)
                {
                    product.Stock -= item.Quantity;
                    if (product.Stock < 0) product.Stock = 0;
                }
            }

            // Create inventory check
            var inventoryCheck = new InventoryCheck
            {
                Code = await GenerateInventoryCheckCodeAsync(),
                CheckTime = returnGoods.ReturnTime,
                Note = $"Phiếu tự động - Trả hàng {returnGoods.Code}",
                Status = InventoryCheckStatus.Balanced,
                BalancedAt = DateTime.UtcNow,
                IsAutoGenerated = true,
                CreatedBy = _currentUser.Username,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            foreach (var item in returnGoods.Items)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product != null)
                {
                    inventoryCheck.Items.Add(new InventoryCheckItem
                    {
                        ProductId = item.ProductId,
                        ActualQuantity = product.Stock,
                        SystemQuantity = product.Stock, // Should be the same after return
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
            }

            _context.InventoryChecks.Add(inventoryCheck);
        }

        private async Task<string> GenerateInventoryCheckCodeAsync()
        {
            var today = DateTime.UtcNow.Date;
            var count = await _context.InventoryChecks
                .Where(x => x.CreatedAt >= today)
                .CountAsync();

            return $"KK{(count + 1):D6}";
        }
    }
}

using System.Net;
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
        private readonly IInventoryCardService _inventoryCardService;

        public ReturnGoodsService(
            ApplicationDbContext context,
            ICurrentUser currentUser,
            IInventoryCardService inventoryCardService
        )
        {
            _context = context;
            _currentUser = currentUser;
            _inventoryCardService = inventoryCardService;
        }

        public async Task<List<ListReturnGoodsResponse>> ListAsync(
            DateTime? from,
            DateTime? to,
            int? status
        )
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
                    Status = (int)r.Status,
                })
                .ToListAsync();

            return returnGoods;
        }

        public async Task<DetailReturnGoodsResponse> DetailAsync(int id)
        {
            var returnGoods = await _context
                .ReturnGoods.Include(x => x.Supplier)
                .Include(x => x.StoreBankAccount)
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
                CreatedBy = returnGoods.CreatedBy ?? string.Empty,
                TotalValue = returnGoods.TotalValue,
                Discount = returnGoods.Discount,
                SupplierNeedToPay = returnGoods.SupplierNeedToPay,
                SupplierPaid = returnGoods.SupplierPaid,
                PaymentMethod = returnGoods.PaymentMethod,
                StoreBankAccountId = returnGoods.StoreBankAccountId,
                StoreBankAccountNumber = returnGoods.StoreBankAccount?.AccountNumber,
                StoreBankAccountName = returnGoods.StoreBankAccount?.AccountName,
                StoreBankName = returnGoods.StoreBankAccount?.BankName,
                Note = returnGoods.Note,
                Status = (int)returnGoods.Status,
                Items = returnGoods
                    .Items.Select(i => new DetailReturnGoodsItem
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
                        Note = i.Note,
                    })
                    .ToList(),
            };
        }

        public async Task<int> CreateAsync(CreateReturnGoodsRequest request)
        {
            try
            {
                var code = await GenerateCodeAsync();

                if (request.Items.Count == 0)
                {
                    throw new ApiException(
                        "Phiếu trả hàng phải có ít nhất một sản phẩm",
                        HttpStatusCode.BadRequest
                    );
                }

                // Kiểm tra supplier có tồn tại không
                var supplier = await _context.Suppliers.FirstOrDefaultAsync(s =>
                    s.Id == request.SupplierId
                );

                if (supplier == null)
                {
                    throw new ApiException(
                        $"Nhà cung cấp không tồn tại: {request.SupplierId}",
                        HttpStatusCode.NotFound
                    );
                }

                // Kiểm tra StoreBankAccount nếu PaymentMethod là transfer
                if (request.PaymentMethod == 1 && request.StoreBankAccountId.HasValue)
                {
                    var storeBankAccount = await _context.StoreBankAccounts.FirstOrDefaultAsync(s =>
                        s.Id == request.StoreBankAccountId.Value
                    );

                    if (storeBankAccount == null)
                    {
                        throw new ApiException(
                            $"Tài khoản ngân hàng không tồn tại: {request.StoreBankAccountId}",
                            HttpStatusCode.NotFound
                        );
                    }
                }

                var returnGoods = new ReturnGoods
                {
                    Code = code,
                    ReturnTime =
                        request.ReturnTime.Kind == DateTimeKind.Utc
                            ? request.ReturnTime
                            : request.ReturnTime.ToUniversalTime(),
                    SupplierId = request.SupplierId,
                    ReturnBy = request.ReturnBy ?? string.Empty,
                    Note = request.Note ?? string.Empty,
                    Discount = request.Discount,
                    SupplierPaid = request.SupplierPaid,
                    PaymentMethod = request.PaymentMethod,
                    StoreBankAccountId = request.StoreBankAccountId,
                    Status = request.Complete
                        ? ReturnGoodsStatus.Completed
                        : ReturnGoodsStatus.Draft,
                    CreatedBy = _currentUser.Username,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };

                // Calculate totals
                decimal totalValue = 0;
                foreach (var item in request.Items)
                {
                    // Kiểm tra sản phẩm có tồn tại không
                    var product = await _context.Products.FirstOrDefaultAsync(p =>
                        p.Id == item.ProductId
                    );

                    if (product == null)
                    {
                        throw new ApiException(
                            $"Sản phẩm không tồn tại: {item.ProductId}",
                            HttpStatusCode.NotFound
                        );
                    }

                    var lineTotal = (item.Quantity * item.ReturnPrice) - item.Discount;
                    totalValue += lineTotal;

                    returnGoods.Items.Add(
                        new ReturnGoodsItem
                        {
                            ProductId = item.ProductId,
                            Quantity = item.Quantity,
                            ImportPrice = item.ImportPrice,
                            ReturnPrice = item.ReturnPrice,
                            Discount = item.Discount,
                            LineTotal = lineTotal,
                            Note = item.Note ?? string.Empty,
                        }
                    );
                }

                returnGoods.TotalValue = totalValue;
                returnGoods.SupplierNeedToPay = totalValue - request.Discount;

                // Auto set payment amount when completing with cash payment
                if (request.Complete && request.PaymentMethod == 0) // 0 = cash
                {
                    returnGoods.SupplierPaid = returnGoods.SupplierNeedToPay;
                }

                _context.ReturnGoods.Add(returnGoods);

                if (request.Complete)
                {
                    await ProcessReturnGoodsAsync(returnGoods);
                }

                await _context.SaveChangesAsync();
                return returnGoods.Id;
            }
            catch (ApiException)
            {
                // Rethrow ApiExceptions as they are already properly formatted
                throw;
            }
            catch (Exception ex)
            {
                throw new ApiException($"Lỗi khi tạo phiếu trả hàng: {ex.Message}");
            }
        }

        public async Task UpdateAsync(int id, CreateReturnGoodsRequest request)
        {
            var returnGoods = await _context
                .ReturnGoods.Include(x => x.Items)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (returnGoods == null)
            {
                throw new ApiException("Không tìm thấy phiếu trả hàng");
            }

            if (returnGoods.Status != ReturnGoodsStatus.Draft)
            {
                throw new ApiException("Chỉ có thể chỉnh sửa phiếu nháp");
            }

            returnGoods.ReturnTime =
                request.ReturnTime.Kind == DateTimeKind.Utc
                    ? request.ReturnTime
                    : request.ReturnTime.ToUniversalTime();
            returnGoods.SupplierId = request.SupplierId;
            returnGoods.ReturnBy = request.ReturnBy ?? string.Empty;
            returnGoods.Note = request.Note ?? string.Empty;
            returnGoods.Discount = request.Discount;
            returnGoods.SupplierPaid = request.SupplierPaid;
            returnGoods.PaymentMethod = request.PaymentMethod;
            returnGoods.StoreBankAccountId = request.StoreBankAccountId;
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

                returnGoods.Items.Add(
                    new ReturnGoodsItem
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        ImportPrice = item.ImportPrice,
                        ReturnPrice = item.ReturnPrice,
                        Discount = item.Discount,
                        LineTotal = lineTotal,
                        Note = item.Note ?? string.Empty,
                    }
                );
            }

            returnGoods.TotalValue = totalValue;
            returnGoods.SupplierNeedToPay = totalValue - request.Discount;

            await _context.SaveChangesAsync();
        }

        public async Task CompleteAsync(int id)
        {
            var returnGoods = await _context
                .ReturnGoods.Include(x => x.Items)
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

            // Auto set payment amount when completing with cash payment
            if (returnGoods.PaymentMethod == 0) // 0 = cash
            {
                returnGoods.SupplierPaid = returnGoods.SupplierNeedToPay;
            }

            await ProcessReturnGoodsAsync(returnGoods);
            await _context.SaveChangesAsync();
        }

        public async Task CancelAsync(int id, string? note = null)
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
            if (!string.IsNullOrEmpty(note))
            {
                returnGoods.Note = note;
            }
            returnGoods.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task UpdateNoteAsync(int id, string note)
        {
            var returnGoods = await _context.ReturnGoods.FirstOrDefaultAsync(x => x.Id == id);

            if (returnGoods == null)
            {
                throw new ApiException("Không tìm thấy phiếu trả hàng");
            }

            // Cho phép cập nhật note ở mọi trạng thái, đặc biệt là Cancelled
            returnGoods.Note = note ?? string.Empty;
            returnGoods.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        private async Task<string> GenerateCodeAsync()
        {
            var today = DateTime.UtcNow.Date;
            var count = await _context.ReturnGoods.Where(x => x.CreatedAt >= today).CountAsync();

            return $"THN{(count + 1):D6}";
        }

        private async Task ProcessReturnGoodsAsync(ReturnGoods returnGoods)
        {
            foreach (var item in returnGoods.Items)
            {
                var inventoryCode =
                    await _inventoryCardService.GenerateNextInventoryCardCodeAsync();

                var inventoryCard = new InventoryCard
                {
                    ProductId = item.ProductId,
                    Code = inventoryCode,
                    Method = "Trả hàng nhà cung cấp",
                    OccurredAt = returnGoods.ReturnTime,
                    CostPrice = item.ReturnPrice,
                    QuantityChange = -item.Quantity
                };

                // Get product để lấy stock hiện tại
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product == null)
                {
                    throw new ApiException(
                        $"Sản phẩm không tồn tại: {item.ProductId}",
                        HttpStatusCode.NotFound
                    );
                }

                // Calculate final inventory stock
                var currentStock = product.Stock;
                var newStock = currentStock - item.Quantity;
                if (newStock < 0)
                {
                    newStock = 0;
                }

                inventoryCard.EndingStock = newStock;
                _context.InventoryCards.Add(inventoryCard);

                // Update product stock
                product.Stock = newStock;
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
                UpdatedAt = DateTime.UtcNow,
            };

            foreach (var item in returnGoods.Items)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product != null)
                {
                // System quantity = stock BEFORE return
                // Actual quantity = stock AFTER return  
                // For return goods: stock decreases, so SystemQuantity > ActualQuantity
                var systemQuantity = product.Stock + item.Quantity; // Stock before return
                var actualQuantity = product.Stock; // Stock after return
                
                inventoryCheck.Items.Add(
                    new InventoryCheckItem
                    {
                        ProductId = item.ProductId,
                        SystemQuantity = systemQuantity, // Stock before return
                        ActualQuantity = actualQuantity, // Stock after return
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    }
                );
                }
            }

            _context.InventoryChecks.Add(inventoryCheck);
        }

        private async Task<string> GenerateInventoryCheckCodeAsync()
        {
            var today = DateTime.UtcNow.Date;
            var count = await _context
                .InventoryChecks.Where(x => x.CreatedAt >= today)
                .CountAsync();

            return $"KK{(count + 1):D6}";
        }
    }
}

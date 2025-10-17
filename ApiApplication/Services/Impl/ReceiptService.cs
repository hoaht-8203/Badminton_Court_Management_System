using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Dtos.Receipt;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class ReceiptService(ApplicationDbContext context) : IReceiptService
{
    private readonly ApplicationDbContext _context = context;

    public async Task<List<ListReceiptResponse>> ListAsync(
        DateTime? from,
        DateTime? to,
        int? status
    )
    {
        var q = _context.Receipts.Include(r => r.Supplier).AsQueryable();
        if (from.HasValue)
            q = q.Where(r => r.ReceiptTime >= from.Value);
        if (to.HasValue)
            q = q.Where(r => r.ReceiptTime <= to.Value);
        if (status.HasValue)
            q = q.Where(r => (int)r.Status == status.Value);

        return await q.OrderByDescending(r => r.Id)
            .Select(r => new ListReceiptResponse
            {
                Id = r.Id,
                Code = r.Code,
                ReceiptTime = r.ReceiptTime,
                SupplierName = r.Supplier.Name,
                NeedPay = r.PaymentAmount,
                Status = (int)r.Status,
            })
            .ToListAsync();
    }

    public async Task<int> CreateAsync(CreateReceiptRequest req)
    {
        var entity = new Receipt
        {
            SupplierId = req.SupplierId,
            ReceiptTime = req.ReceiptTime,
            PaymentMethod = req.PaymentMethod,
            Discount = req.Discount,
            PaymentAmount = req.PaymentAmount,
            SupplierBankAccountNumber = req.SupplierBankAccountNumber,
            SupplierBankAccountName = req.SupplierBankAccountName,
            SupplierBankName = req.SupplierBankName,
            Status = req.Complete ? ReceiptStatus.Completed : ReceiptStatus.Draft,
        };
        entity.Code = await GenerateNextReceiptCodeAsync();
        entity.Items = req
            .Items.Select(i => new ReceiptItem
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                CostPrice = i.CostPrice,
            })
            .ToList();
        _context.Receipts.Add(entity);

        if (req.Complete)
        {
            var productIds = entity.Items.Select(i => i.ProductId).Distinct().ToList();
            var products = await _context
                .Products.Where(p => productIds.Contains(p.Id))
                .ToListAsync();
            foreach (var it in entity.Items)
            {
                var p = products.First(x => x.Id == it.ProductId);
                p.Stock += it.Quantity;
                _context.InventoryCards.Add(
                    new InventoryCard
                    {
                        ProductId = p.Id,
                        Code = await GenerateNextInventoryCardCodeAsync(),
                        Method = "Nhập hàng",
                        OccurredAt = entity.ReceiptTime,
                        CostPrice = it.CostPrice,
                        QuantityChange = it.Quantity,
                        EndingStock = p.Stock,
                    }
                );
            }

            // Tạo phiếu kiểm kho tự động khi nhập kho
            await CreateInventoryCheckForReceiptAsync(entity);
        }

        await _context.SaveChangesAsync();
        return entity.Id;
    }

    public async Task<DetailReceiptResponse> DetailAsync(int id)
    {
        var r =
            await _context
                .Receipts.Include(x => x.Items)
                .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new ApiException(
                "Không tìm thấy phiếu nhập",
                System.Net.HttpStatusCode.NotFound
            );
        return new DetailReceiptResponse
        {
            Id = r.Id,
            Code = r.Code,
            ReceiptTime = r.ReceiptTime,
            SupplierId = r.SupplierId,
            PaymentMethod = r.PaymentMethod,
            Discount = r.Discount,
            PaymentAmount = r.PaymentAmount,
            SupplierBankAccountNumber = r.SupplierBankAccountNumber,
            SupplierBankAccountName = r.SupplierBankAccountName,
            SupplierBankName = r.SupplierBankName,
            Status = (int)r.Status,
            Items = r
                .Items.Select(i => new DetailReceiptItem
                {
                    ProductId = i.ProductId,
                    ProductCode = i.Product.Code,
                    ProductName = i.Product.Name,
                    Quantity = i.Quantity,
                    CostPrice = i.CostPrice,
                })
                .ToList(),
        };
    }

    public async Task UpdateAsync(int id, CreateReceiptRequest req)
    {
        var r =
            await _context.Receipts.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new ApiException(
                "Không tìm thấy phiếu nhập",
                System.Net.HttpStatusCode.NotFound
            );
        if (r.Status == ReceiptStatus.Completed)
            throw new ApiException(
                "Phiếu đã hoàn thành không thể sửa",
                System.Net.HttpStatusCode.BadRequest
            );

        r.ReceiptTime = req.ReceiptTime;
        r.SupplierId = req.SupplierId;
        r.PaymentMethod = req.PaymentMethod;
        r.Discount = req.Discount;
        r.PaymentAmount = req.PaymentAmount;
        r.SupplierBankAccountNumber = req.SupplierBankAccountNumber;
        r.SupplierBankAccountName = req.SupplierBankAccountName;
        r.SupplierBankName = req.SupplierBankName;

        // replace items
        _context.ReceiptItems.RemoveRange(r.Items);
        r.Items = req
            .Items.Select(i => new ReceiptItem
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                CostPrice = i.CostPrice,
            })
            .ToList();

        await _context.SaveChangesAsync();
    }

    public async Task CompleteAsync(int id)
    {
        var r =
            await _context.Receipts.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new ApiException(
                "Không tìm thấy phiếu nhập",
                System.Net.HttpStatusCode.NotFound
            );
        if (r.Status == ReceiptStatus.Completed)
            return;

        r.Status = ReceiptStatus.Completed;

        // Update product stock and create inventory cards
        var productIds = r.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _context.Products.Where(p => productIds.Contains(p.Id)).ToListAsync();
        foreach (var it in r.Items)
        {
            var p = products.First(x => x.Id == it.ProductId);
            p.Stock += it.Quantity;
            _context.InventoryCards.Add(
                new InventoryCard
                {
                    ProductId = p.Id,
                    Code = await GenerateNextInventoryCardCodeAsync(),
                    Method = "Nhập hàng",
                    OccurredAt = r.ReceiptTime,
                    CostPrice = it.CostPrice,
                    QuantityChange = it.Quantity,
                    EndingStock = p.Stock,
                }
            );
        }

        // Tạo phiếu kiểm kho tự động khi hoàn thành phiếu nhập
        await CreateInventoryCheckForReceiptAsync(r);
    }

    public async Task CancelAsync(int id)
    {
        var r =
            await _context.Receipts.FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new ApiException(
                "Không tìm thấy phiếu nhập",
                System.Net.HttpStatusCode.NotFound
            );
        if (r.Status != ReceiptStatus.Draft)
            throw new ApiException("Chỉ hủy phiếu tạm", System.Net.HttpStatusCode.BadRequest);
        r.Status = ReceiptStatus.Cancelled;
        await _context.SaveChangesAsync();
    }

    private async Task<string> GenerateNextReceiptCodeAsync()
    {
        var last = await _context
            .Receipts.OrderByDescending(x => x.Id)
            .Select(x => x.Code)
            .FirstOrDefaultAsync();
        if (string.IsNullOrWhiteSpace(last) || last.Length < 2)
            return "PN000001"; // Phiếu nhập
        var numStr = new string(last.Skip(2).ToArray());
        if (!int.TryParse(numStr, out var num))
            return "PN000001";
        return $"PN{(num + 1).ToString("D6")}";
    }

    private async Task<string> GenerateNextInventoryCardCodeAsync()
    {
        var last = await _context
            .InventoryCards.OrderByDescending(x => x.Id)
            .Select(x => x.Code)
            .FirstOrDefaultAsync();
        if (string.IsNullOrWhiteSpace(last) || last.Length < 2)
            return "TC000001";
        var numStr = new string(last.Skip(2).ToArray());
        if (!int.TryParse(numStr, out var num))
            return "TC000001";
        return $"TC{(num + 1).ToString("D6")}";
    }

    private async Task<string> GenerateNextInventoryCodeAsync()
    {
        var last = await _context
            .InventoryChecks.OrderByDescending(x => x.Id)
            .Select(x => x.Code)
            .FirstOrDefaultAsync();
        if (string.IsNullOrWhiteSpace(last) || last.Length < 2)
            return "KK000001"; // Kiểm kho
        var numStr = new string(last.Skip(2).ToArray());
        if (!int.TryParse(numStr, out var num))
            return "KK000001";
        return $"KK{(num + 1).ToString("D6")}";
    }

    private async Task CreateInventoryCheckForReceiptAsync(Receipt receipt)
    {
        try
        {
            Console.WriteLine($"DEBUG: Creating inventory check for receipt {receipt.Code}");

            // Tạo phiếu kiểm kho
            var invCheck = new InventoryCheck
            {
                Code = await GenerateNextInventoryCodeAsync(),
                CheckTime = receipt.ReceiptTime,
                Status = InventoryCheckStatus.Balanced,
                BalancedAt = DateTime.UtcNow,
                Note = $"Phiếu tự động - Nhập kho {receipt.Code}",
                IsAutoGenerated = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            Console.WriteLine($"DEBUG: Inventory check created with code {invCheck.Code}");

            // Lấy thông tin sản phẩm sau khi cập nhật stock
            var productIds = receipt.Items.Select(i => i.ProductId).Distinct().ToList();
            var productStocks = await _context
                .Products.Where(p => productIds.Contains(p.Id))
                .Select(p => new { p.Id, p.Stock })
                .ToListAsync();

            // Thêm phiếu kiểm kho vào context
            _context.InventoryChecks.Add(invCheck);
            await _context.SaveChangesAsync(); // Lưu để lấy ID

            // Tạo các item cho phiếu kiểm kho
            var inventoryItems = receipt
                .Items.Select(item => new InventoryCheckItem
                {
                    InventoryCheckId = invCheck.Id,
                    ProductId = item.ProductId,
                    SystemQuantity =
                        productStocks.First(ps => ps.Id == item.ProductId).Stock - item.Quantity, // Số lượng trước khi nhập
                    ActualQuantity = productStocks.First(ps => ps.Id == item.ProductId).Stock, // Số lượng sau khi nhập
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                })
                .ToList();

            // Thêm các item vào context
            foreach (var item in inventoryItems)
            {
                _context.InventoryCheckItems.Add(item);
            }

            await _context.SaveChangesAsync();
            Console.WriteLine(
                $"DEBUG: Inventory check saved successfully with ID {invCheck.Id}, Items count: {inventoryItems.Count}"
            );
        }
        catch (ApiException ex)
        {
            Console.WriteLine(
                $"API ERROR: Failed to create inventory check for receipt {receipt.Code}: {ex.Message}"
            );
            Console.WriteLine($"API ERROR: Status Code: {ex.StatusCode}");
            // Không throw exception để không ảnh hưởng đến việc hoàn thành phiếu nhập
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"ERROR: Failed to create inventory check for receipt {receipt.Code}: {ex.Message}"
            );
            Console.WriteLine($"ERROR: Stack trace: {ex.StackTrace}");
            // Không throw exception để không ảnh hưởng đến việc hoàn thành phiếu nhập
        }
    }
}

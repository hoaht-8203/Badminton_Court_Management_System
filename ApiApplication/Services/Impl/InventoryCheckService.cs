using ApiApplication.Data;
using ApiApplication.Dtos.InventoryCheck;
using ApiApplication.Entities;
using ApiApplication.Exceptions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class InventoryCheckService(ApplicationDbContext context, IMapper mapper)
    : IInventoryCheckService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;

    public async Task<List<ListInventoryCheckResponse>> ListAsync(ListInventoryCheckRequest request)
    {
        try
        {
            var query = _context.InventoryChecks.AsQueryable();

            if (request.Id.HasValue)
            {
                query = query.Where(x => x.Id == request.Id);
            }
            if (!string.IsNullOrWhiteSpace(request.Code))
            {
                var code = request.Code.ToLower();
                query = query.Where(x => x.Code.ToLower().Contains(code));
            }
            if (request.Status.HasValue)
            {
                query = query.Where(x => x.Status == request.Status);
            }

            var result = await query
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new ListInventoryCheckResponse
                {
                    Id = x.Id,
                    Code = x.Code,
                    CheckTime = x.CheckTime,
                    Status = x.Status,
                    BalancedAt = x.BalancedAt,
                    Note = x.Note,
                    TotalDeltaIncrease = x.Items.Sum(i =>
                        i.ActualQuantity > i.SystemQuantity
                            ? i.ActualQuantity - i.SystemQuantity
                            : 0
                    ),
                    TotalDeltaDecrease = x.Items.Sum(i =>
                        i.SystemQuantity > i.ActualQuantity
                            ? i.SystemQuantity - i.ActualQuantity
                            : 0
                    ),
                    TotalDelta = x.Items.Sum(i => i.ActualQuantity - i.SystemQuantity),
                    TotalDeltaValue = x.Items.Sum(i =>
                        (i.ActualQuantity - i.SystemQuantity) * i.Product.CostPrice
                    ),
                })
                .ToListAsync();

            return result;
        }
        catch (Exception ex)
        {
            throw new ApiException(
                $"List inventory checks failed: {ex.Message}",
                System.Net.HttpStatusCode.InternalServerError
            );
        }
    }

    public async Task<DetailInventoryCheckResponse> DetailAsync(int id)
    {
        try
        {
            var entity = await _context
                .InventoryChecks.Include(x => x.Items)
                .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
            {
                throw new ApiException(
                    $"Phiếu kiểm kho không tồn tại: {id}",
                    System.Net.HttpStatusCode.NotFound
                );
            }
            var detail = _mapper.Map<DetailInventoryCheckResponse>(entity);
            // fill pricing for items
            foreach (var item in detail.Items)
            {
                var source = entity.Items.First(i => i.ProductId == item.ProductId);
                item.CostPrice = source.Product.CostPrice;
            }
            return detail;
        }
        catch (Exception ex)
        {
            throw new ApiException(
                $"Detail inventory check failed: {ex.Message}",
                System.Net.HttpStatusCode.InternalServerError
            );
        }
    }

    public async Task<int> CreateAsync(CreateInventoryCheckRequest request)
    {
        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var existingProducts = await _context
            .Products.Where(p => productIds.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync();
        var missing = productIds.Except(existingProducts).ToList();
        if (missing.Count > 0)
        {
            throw new ApiException(
                $"Sản phẩm không tồn tại: {string.Join(",", missing)}",
                System.Net.HttpStatusCode.BadRequest
            );
        }

        var entity = _mapper.Map<InventoryCheck>(request);
        entity.Code = await GenerateNextCodeAsync();
        entity.Items = request.Items.Select(i => _mapper.Map<InventoryCheckItem>(i)).ToList();
        entity.Status = Entities.Shared.InventoryCheckStatus.Draft;
        entity.BalancedAt = null;

        _context.InventoryChecks.Add(entity);
        await _context.SaveChangesAsync();
        return entity.Id;
    }

    private async Task<string> GenerateNextCodeAsync()
    {
        var last = await _context
            .InventoryChecks.OrderByDescending(x => x.Id)
            .Select(x => x.Code)
            .FirstOrDefaultAsync();
        if (string.IsNullOrWhiteSpace(last) || last.Length < 2)
        {
            return "KK000001";
        }
        var numberPart = new string(last.Skip(2).ToArray());
        if (!int.TryParse(numberPart, out var num))
        {
            return "KK000001";
        }
        return $"KK{(num + 1).ToString("D6")}";
    }

    public async Task UpdateAsync(int id, CreateInventoryCheckRequest request)
    {
        var entity = await _context
            .InventoryChecks.Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
        {
            throw new ApiException(
                $"Phiếu kiểm kho không tồn tại: {id}",
                System.Net.HttpStatusCode.NotFound
            );
        }
        if (entity.Status == Entities.Shared.InventoryCheckStatus.Cancelled)
        {
            throw new ApiException(
                "Phiếu kiểm kho đã bị hủy, không thể cập nhật",
                System.Net.HttpStatusCode.BadRequest
            );
        }

        // Cập nhật thông tin cơ bản
        entity.CheckTime = request.CheckTime;
        entity.Note = request.Note;

        // Xử lý các items
        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var existingProducts = await _context
            .Products.Where(p => productIds.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync();

        var missing = productIds.Except(existingProducts).ToList();
        if (missing.Count > 0)
        {
            throw new ApiException(
                $"Sản phẩm không tồn tại: {string.Join(",", missing)}",
                System.Net.HttpStatusCode.BadRequest
            );
        }

        // Xóa các item cũ
        _context.InventoryCheckItems.RemoveRange(entity.Items);

        // Thêm các item mới
        entity.Items = request
            .Items.Select(i => new InventoryCheckItem
            {
                InventoryCheckId = id,
                ProductId = i.ProductId,
                SystemQuantity = i.SystemQuantity,
                ActualQuantity = i.ActualQuantity,
            })
            .ToList();

        // Sau khi cập nhật phiếu tạm → chuyển thành trạng thái "Đã cân bằng" và cập nhật tồn kho
        entity.Status = Entities.Shared.InventoryCheckStatus.Balanced;
        entity.BalancedAt = DateTime.UtcNow;

        // Cập nhật tồn kho sản phẩm
        var products = await _context.Products.Where(p => productIds.Contains(p.Id)).ToListAsync();

        foreach (var item in request.Items)
        {
            var product = products.FirstOrDefault(p => p.Id == item.ProductId);
            if (product != null)
            {
                var previous = product.Stock;
                product.Stock = item.ActualQuantity;
                // Write inventory card
                _context.InventoryCards.Add(
                    new InventoryCard
                    {
                        ProductId = product.Id,
                        Code = await GenerateNextInventoryCardCodeAsync(),
                        Method = "Kiểm hàng",
                        OccurredAt = DateTime.UtcNow,
                        CostPrice = product.CostPrice,
                        QuantityChange = item.ActualQuantity - previous,
                        EndingStock = product.Stock,
                    }
                );
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task CancelAsync(int id)
    {
        var entity = await _context.InventoryChecks.FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
        {
            throw new ApiException(
                $"Phiếu kiểm kho không tồn tại: {id}",
                System.Net.HttpStatusCode.NotFound
            );
        }
        if (entity.Status == Entities.Shared.InventoryCheckStatus.Cancelled)
        {
            return;
        }
        entity.Status = Entities.Shared.InventoryCheckStatus.Cancelled;
        await _context.SaveChangesAsync();
    }

    public async Task<List<int>> BulkCancelAsync(List<int> ids)
    {
        var entities = await _context.InventoryChecks.Where(x => ids.Contains(x.Id)).ToListAsync();

        var cancelledIds = entities.Select(x => x.Id).ToList();

        foreach (var entity in entities)
        {
            entity.Status = Entities.Shared.InventoryCheckStatus.Cancelled;
        }

        await _context.SaveChangesAsync();
        return cancelledIds;
    }

    public async Task CompleteAsync(int id)
    {
        var entity = await _context
            .InventoryChecks.Include(x => x.Items)
            .ThenInclude(x => x.Product)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
        {
            throw new ApiException(
                $"Phiếu kiểm kho không tồn tại: {id}",
                System.Net.HttpStatusCode.NotFound
            );
        }
        if (entity.Status == Entities.Shared.InventoryCheckStatus.Cancelled)
        {
            throw new ApiException(
                "Phiếu kiểm kho đã bị hủy, không thể hoàn thành",
                System.Net.HttpStatusCode.BadRequest
            );
        }
        if (entity.Status == Entities.Shared.InventoryCheckStatus.Balanced)
        {
            return; // Already balanced
        }

        // Cập nhật tồn kho sản phẩm khi hoàn thành
        var products = await _context
            .Products.Where(p => entity.Items.Select(i => i.ProductId).Contains(p.Id))
            .ToListAsync();

        foreach (var item in entity.Items)
        {
            var product = products.FirstOrDefault(p => p.Id == item.ProductId);
            if (product != null)
            {
                var previous = product.Stock;
                product.Stock = item.ActualQuantity;
                // Write inventory card
                _context.InventoryCards.Add(
                    new InventoryCard
                    {
                        ProductId = product.Id,
                        Code = await GenerateNextInventoryCardCodeAsync(),
                        Method = "Hoàn thành kiểm kho",
                        OccurredAt = DateTime.UtcNow,
                        CostPrice = product.CostPrice,
                        QuantityChange = item.ActualQuantity - previous,
                        EndingStock = product.Stock,
                    }
                );
            }
        }

        entity.Status = Entities.Shared.InventoryCheckStatus.Balanced;
        entity.BalancedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task<int> MergeAsync(List<int> ids)
    {
        if (ids.Count < 2)
        {
            throw new ApiException(
                "Cần ít nhất 2 phiếu để gộp",
                System.Net.HttpStatusCode.BadRequest
            );
        }

        // Lấy các phiếu kiểm kho
        var entities = await _context
            .InventoryChecks.Include(x => x.Items)
            .ThenInclude(i => i.Product)
            .Where(x => ids.Contains(x.Id))
            .ToListAsync();

        if (entities.Count != ids.Count)
        {
            throw new ApiException(
                "Một số phiếu kiểm kho không tồn tại",
                System.Net.HttpStatusCode.NotFound
            );
        }

        // Kiểm tra tất cả phiếu đều ở trạng thái Draft (Phiếu tạm)
        var nonDraftChecks = entities
            .Where(x => x.Status != Entities.Shared.InventoryCheckStatus.Draft)
            .ToList();
        if (nonDraftChecks.Any())
        {
            var codes = string.Join(", ", nonDraftChecks.Select(x => x.Code));
            throw new ApiException(
                $"Chỉ có thể gộp các phiếu tạm. Các phiếu sau không phải phiếu tạm: {codes}",
                System.Net.HttpStatusCode.BadRequest
            );
        }

        // Tạo phiếu mới từ việc gộp
        var mergedCode = await GenerateNextCodeAsync();
        var mergedNote = $"Gộp các phiếu: {string.Join(", ", entities.Select(x => x.Code))}";

        var mergedCheck = new InventoryCheck
        {
            Code = mergedCode,
            CheckTime = DateTime.UtcNow,
            Status = Entities.Shared.InventoryCheckStatus.Balanced,
            BalancedAt = DateTime.UtcNow,
            Note = mergedNote,
            Items = new List<InventoryCheckItem>(),
        };

        // Gộp tất cả items từ các phiếu
        var allItems = entities.SelectMany(x => x.Items).ToList();
        var groupedItems = allItems.GroupBy(x => x.ProductId).ToList();

        foreach (var group in groupedItems)
        {
            var productId = group.Key;
            var product = group.First().Product;

            // Tính tổng số lượng thực tế (lấy giá trị cao nhất)
            var maxActualQuantity = group.Max(x => x.ActualQuantity);
            var systemQuantity = product.Stock;

            mergedCheck.Items.Add(
                new InventoryCheckItem
                {
                    ProductId = productId,
                    SystemQuantity = systemQuantity,
                    ActualQuantity = maxActualQuantity,
                }
            );
        }

        _context.InventoryChecks.Add(mergedCheck);

        // Cập nhật tồn kho sản phẩm
        var productIds = groupedItems.Select(x => x.Key).ToList();
        var products = await _context.Products.Where(p => productIds.Contains(p.Id)).ToListAsync();

        foreach (var group in groupedItems)
        {
            var product = products.FirstOrDefault(p => p.Id == group.Key);
            if (product != null)
            {
                var maxActualQuantity = group.Max(x => x.ActualQuantity);
                product.Stock = maxActualQuantity;
            }
        }

        // Hủy các phiếu cũ
        foreach (var entity in entities)
        {
            entity.Status = Entities.Shared.InventoryCheckStatus.Cancelled;
        }

        await _context.SaveChangesAsync();
        return mergedCheck.Id;
    }

    private async Task<string> GenerateNextInventoryCardCodeAsync()
    {
        var last = await _context
            .InventoryCards.OrderByDescending(x => x.Id)
            .Select(x => x.Code)
            .FirstOrDefaultAsync();
        if (string.IsNullOrWhiteSpace(last) || last.Length < 2)
        {
            return "TC000001";
        }
        var numberPart = new string(last.Skip(2).ToArray());
        if (!int.TryParse(numberPart, out var num))
        {
            return "TC000001";
        }
        return $"TC{(num + 1).ToString("D6")}";
    }
}

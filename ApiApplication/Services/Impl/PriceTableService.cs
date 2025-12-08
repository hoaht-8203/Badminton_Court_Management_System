using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Dtos.PriceTable;
using ApiApplication.Entities;
using ApiApplication.Exceptions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class PriceTableService(ApplicationDbContext context, IMapper mapper) : IPriceTableService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;

    public async Task<List<ListPriceTableResponse>> ListAsync(ListPriceTableRequest request)
    {
        var query = _context.Set<PriceTable>().AsQueryable();
        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            var name = request.Name.ToLower();
            query = query.Where(x => x.Name != null && x.Name.ToLower().Contains(name));
        }
        if (request.IsActive.HasValue)
        {
            query = query.Where(x => x.IsActive == request.IsActive);
        }
        var items = await query.OrderByDescending(x => x.CreatedAt).ToListAsync();
        return _mapper.Map<List<ListPriceTableResponse>>(items);
    }

    public async Task<DetailPriceTableResponse> DetailAsync(int id)
    {
        var item = await _context
            .Set<PriceTable>()
            .Include(x => x.TimeRanges)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (item == null)
            throw new ArgumentException($"Bảng giá không tồn tại: {id}");
        return _mapper.Map<DetailPriceTableResponse>(item);
    }

    public async Task CreateAsync(CreatePriceTableRequest request)
    {
        try
        {
            // Unique name check
            if (!string.IsNullOrWhiteSpace(request.Name))
            {
                var existed = await _context.PriceTables.AnyAsync(x => x.Name == request.Name);
                if (existed)
                {
                    throw new ApiException(
                        $"Tên bảng giá đã tồn tại: {request.Name}",
                        System.Net.HttpStatusCode.BadRequest
                    );
                }
            }

            // Validate không trùng thời gian với các bảng giá khác
            var existingPriceTables = await _context.PriceTables
                .Where(pt => pt.IsActive)
                .ToListAsync();

            foreach (var existing in existingPriceTables)
            {
                // Nếu bảng giá hiện tại không giới hạn thời gian
                if (!existing.EffectiveFrom.HasValue && !existing.EffectiveTo.HasValue)
                {
                    throw new ApiException(
                        "Không thể tạo bảng giá khi đã có bảng giá không giới hạn thời gian đang hoạt động",
                        System.Net.HttpStatusCode.BadRequest
                    );
                }

                // Nếu bảng giá mới không giới hạn thời gian
                if (!request.EffectiveFrom.HasValue && !request.EffectiveTo.HasValue)
                {
                    throw new ApiException(
                        "Không thể tạo bảng giá không giới hạn thời gian khi đã có bảng giá khác đang hoạt động",
                        System.Net.HttpStatusCode.BadRequest
                    );
                }

                // Kiểm tra overlap
                bool hasOverlap = false;
                if (request.EffectiveFrom.HasValue && request.EffectiveTo.HasValue &&
                    existing.EffectiveFrom.HasValue && existing.EffectiveTo.HasValue)
                {
                    // Cả hai đều có thời gian cụ thể
                    hasOverlap = request.EffectiveFrom.Value <= existing.EffectiveTo.Value &&
                                 request.EffectiveTo.Value >= existing.EffectiveFrom.Value;
                }
                else if (request.EffectiveFrom.HasValue && request.EffectiveTo.HasValue)
                {
                    // Bảng giá mới có thời gian, bảng giá cũ không giới hạn
                    if (!existing.EffectiveFrom.HasValue && !existing.EffectiveTo.HasValue)
                    {
                        hasOverlap = true;
                    }
                    // Bảng giá mới có thời gian, bảng giá cũ chỉ có từ ngày
                    else if (existing.EffectiveFrom.HasValue && !existing.EffectiveTo.HasValue)
                    {
                        hasOverlap = request.EffectiveTo.Value >= existing.EffectiveFrom.Value;
                    }
                    // Bảng giá mới có thời gian, bảng giá cũ chỉ có đến ngày
                    else if (!existing.EffectiveFrom.HasValue && existing.EffectiveTo.HasValue)
                    {
                        hasOverlap = request.EffectiveFrom.Value <= existing.EffectiveTo.Value;
                    }
                }
                else if (!request.EffectiveFrom.HasValue && !request.EffectiveTo.HasValue)
                {
                    // Bảng giá mới không giới hạn
                    hasOverlap = true;
                }
                else if (request.EffectiveFrom.HasValue && !request.EffectiveTo.HasValue)
                {
                    // Bảng giá mới chỉ có từ ngày
                    if (!existing.EffectiveFrom.HasValue && !existing.EffectiveTo.HasValue)
                    {
                        hasOverlap = true;
                    }
                    else if (existing.EffectiveFrom.HasValue && existing.EffectiveTo.HasValue)
                    {
                        hasOverlap = request.EffectiveFrom.Value <= existing.EffectiveTo.Value;
                    }
                    else if (existing.EffectiveFrom.HasValue && !existing.EffectiveTo.HasValue)
                    {
                        hasOverlap = true; // Cả hai đều không có ngày kết thúc
                    }
                    else if (!existing.EffectiveFrom.HasValue && existing.EffectiveTo.HasValue)
                    {
                        hasOverlap = request.EffectiveFrom.Value <= existing.EffectiveTo.Value;
                    }
                }
                else if (!request.EffectiveFrom.HasValue && request.EffectiveTo.HasValue)
                {
                    // Bảng giá mới chỉ có đến ngày
                    if (!existing.EffectiveFrom.HasValue && !existing.EffectiveTo.HasValue)
                    {
                        hasOverlap = true;
                    }
                    else if (existing.EffectiveFrom.HasValue && existing.EffectiveTo.HasValue)
                    {
                        hasOverlap = request.EffectiveTo.Value >= existing.EffectiveFrom.Value;
                    }
                    else if (existing.EffectiveFrom.HasValue && !existing.EffectiveTo.HasValue)
                    {
                        hasOverlap = request.EffectiveTo.Value >= existing.EffectiveFrom.Value;
                    }
                    else if (!existing.EffectiveFrom.HasValue && existing.EffectiveTo.HasValue)
                    {
                        hasOverlap = true; // Cả hai đều không có ngày bắt đầu
                    }
                }

                if (hasOverlap)
                {
                    throw new ApiException(
                        $"Không thể tạo bảng giá trùng thời gian với bảng giá '{existing.Name}' đang hoạt động",
                        System.Net.HttpStatusCode.BadRequest
                    );
                }
            }

            var entity = _mapper.Map<PriceTable>(request);
            // Tự động set isActive = false khi tạo mới
            entity.IsActive = false;
            var ranges = request.TimeRanges ?? new List<PriceTimeRangeDto>();
            entity.TimeRanges = ranges
                .Where(r => r != null)
                .Select(r => new PriceTimeRange { StartTime = r.StartTime, EndTime = r.EndTime })
                .ToList();
            _context.Add(entity);
            await _context.SaveChangesAsync();

            // Xử lý products nếu có
            if (request.Products != null && request.Products.Any())
            {
                var productIds = request.Products.Select(i => i.ProductId).ToList();
                var validProducts = await _context
                    .Products.Where(p => productIds.Contains(p.Id))
                    .ToListAsync();

                // Validate giá >= giá vốn
                foreach (var item in request.Products)
                {
                    var product = validProducts.FirstOrDefault(p => p.Id == item.ProductId);
                    if (product != null && item.OverrideSalePrice.HasValue)
                    {
                        if (item.OverrideSalePrice.Value < product.CostPrice)
                        {
                            throw new ApiException(
                                $"Giá áp dụng của sản phẩm '{product.Name}' phải lớn hơn hoặc bằng giá vốn ({product.CostPrice})",
                                System.Net.HttpStatusCode.BadRequest
                            );
                        }
                    }
                }

                // Thêm products vào bảng giá
                foreach (var it in request.Products)
                {
                    if (!validProducts.Any(p => p.Id == it.ProductId))
                        continue;
                    entity.PriceTableProducts.Add(
                        new PriceTableProduct
                        {
                            PriceTableId = entity.Id,
                            ProductId = it.ProductId,
                            OverrideSalePrice = it.OverrideSalePrice,
                        }
                    );
                }
                await _context.SaveChangesAsync();
            }
        }
        catch (ApiException)
        {
            throw;
        }
        catch (DbUpdateException ex)
        {
            var msg = ex.InnerException?.Message ?? ex.Message;
            throw new ApiException(
                $"Create price table failed: {msg}",
                System.Net.HttpStatusCode.BadRequest
            );
        }
    }

    public async Task UpdateAsync(UpdatePriceTableRequest request)
    {
        try
        {
            var entity = await _context
                .Set<PriceTable>()
                .Include(x => x.TimeRanges)
                .FirstOrDefaultAsync(x => x.Id == request.Id);
            if (entity == null)
                throw new ArgumentException($"Bảng giá không tồn tại: {request.Id}");

            // Unique name check (exclude current)
            if (
                !string.IsNullOrWhiteSpace(request.Name)
                && !string.Equals(request.Name, entity.Name, StringComparison.Ordinal)
            )
            {
                var existed = await _context.PriceTables.AnyAsync(x =>
                    x.Name == request.Name && x.Id != request.Id
                );
                if (existed)
                {
                    throw new ApiException(
                        $"Tên bảng giá đã tồn tại: {request.Name}",
                        System.Net.HttpStatusCode.BadRequest
                    );
                }
            }

            _mapper.Map(request, entity);

            // validate and normalize ranges
            var ranges = (request.TimeRanges ?? new List<PriceTimeRangeDto>())
                .Where(r => r != null)
                .Select(r => new { r.StartTime, r.EndTime })
                .ToList();
            foreach (var r in ranges)
            {
                if (r.StartTime >= r.EndTime)
                {
                    throw new ApiException(
                        "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc",
                        System.Net.HttpStatusCode.BadRequest
                    );
                }
            }

            // replace ranges explicitly
            _context.RemoveRange(entity.TimeRanges);
            await _context.SaveChangesAsync();
            entity.TimeRanges.Clear();
            entity.TimeRanges.AddRange(
                ranges.Select(r => new PriceTimeRange
                {
                    PriceTableId = entity.Id,
                    StartTime = r.StartTime,
                    EndTime = r.EndTime,
                })
            );

            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            var msg = ex.InnerException?.Message ?? ex.Message;
            throw new ApiException(
                $"Update price table failed: {msg}",
                System.Net.HttpStatusCode.BadRequest
            );
        }
        catch (ApiException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new ApiException(
                $"Update price table failed: {ex.Message}",
                System.Net.HttpStatusCode.BadRequest
            );
        }
    }

    public async Task DeleteAsync(DeletePriceTableRequest request)
    {
        var entity = await _context.Set<PriceTable>().FirstOrDefaultAsync(x => x.Id == request.Id);
        if (entity == null)
            throw new ArgumentException($"Bảng giá không tồn tại: {request.Id}");

        // Không cho phép xóa bảng giá đang được kích hoạt
        if (entity.IsActive)
        {
            throw new ApiException(
                $"Không thể xóa bảng giá '{entity.Name}' vì đang được kích hoạt. Vui lòng tắt kích hoạt trước khi xóa.",
                System.Net.HttpStatusCode.BadRequest
            );
        }

        _context.Remove(entity);
        await _context.SaveChangesAsync();
    }

    public async Task SetProductsAsync(SetPriceTableProductsRequest request)
    {
        var table = await _context
            .PriceTables.Include(x => x.PriceTableProducts)
            .FirstOrDefaultAsync(x => x.Id == request.PriceTableId);
        if (table == null)
            throw new ArgumentException($"Bảng giá không tồn tại: {request.PriceTableId}");

        var productIds = (request.Products ?? new List<PriceTableProductItem>())
            .Select(i => i.ProductId)
            .ToList();
        var validProducts = await _context
            .Products.Where(p => productIds.Contains(p.Id))
            .ToListAsync();

        // Validate giá >= giá vốn
        foreach (var item in request.Products ?? new List<PriceTableProductItem>())
        {
            var product = validProducts.FirstOrDefault(p => p.Id == item.ProductId);
            if (product != null && item.OverrideSalePrice.HasValue)
            {
                if (item.OverrideSalePrice.Value < product.CostPrice)
                {
                    throw new ApiException(
                        $"Giá áp dụng của sản phẩm '{product.Name}' phải lớn hơn hoặc bằng giá vốn ({product.CostPrice})",
                        System.Net.HttpStatusCode.BadRequest
                    );
                }
            }
        }

        table.PriceTableProducts.Clear();
        foreach (var it in request.Products ?? new List<PriceTableProductItem>())
        {
            if (!validProducts.Any(p => p.Id == it.ProductId))
                continue;
            table.PriceTableProducts.Add(
                new PriceTableProduct
                {
                    PriceTableId = table.Id,
                    ProductId = it.ProductId,
                    OverrideSalePrice = it.OverrideSalePrice,
                }
            );
        }
        await _context.SaveChangesAsync();
    }

    public async Task<ListPriceTableProductsResponse> GetProductsAsync(int priceTableId)
    {
        var priceTable = await _context.PriceTables.FirstOrDefaultAsync(pt =>
            pt.Id == priceTableId
        );

        if (priceTable == null)
        {
            throw new ArgumentException($"Bảng giá không tồn tại: {priceTableId}");
        }

        var items = await _context
            .PriceTableProducts.Where(x => x.PriceTableId == priceTableId)
            .Select(x => new PriceTableProductDto
            {
                PriceTableId = x.PriceTableId,
                ProductId = x.ProductId,
                OverrideSalePrice = x.OverrideSalePrice,
            })
            .ToListAsync();

        return new ListPriceTableProductsResponse
        {
            PriceTableId = priceTableId,
            PriceTableName = priceTable.Name ?? string.Empty,
            Products = items,
        };
    }

    public async Task UpdateStatusAsync(int id, bool isActive)
    {
        var entity = await _context.PriceTables.FirstOrDefaultAsync(x => x.Id == id);
        if (entity == null)
            throw new ArgumentException($"Bảng giá không tồn tại: {id}");

        // Nếu đang cố kích hoạt bảng giá
        if (isActive)
        {
            // Kiểm tra xem đã có bảng giá nào đang kích hoạt chưa
            var activePriceTable = await _context.PriceTables
                .FirstOrDefaultAsync(x => x.IsActive && x.Id != id);

            if (activePriceTable != null)
            {
                throw new ApiException(
                    $"Hiện có bảng giá '{activePriceTable.Name}' đang được áp dụng. Vui lòng tắt bảng giá đó trước khi kích hoạt bảng giá mới.",
                    System.Net.HttpStatusCode.BadRequest
                );
            }
        }

        entity.IsActive = isActive;
        await _context.SaveChangesAsync();
    }
}

using ApiApplication.Data;
using ApiApplication.Dtos;
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
            query = query.Where(x => x.Name.ToLower().Contains(name));
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
        var item = await _context.Set<PriceTable>().Include(x => x.TimeRanges).FirstOrDefaultAsync(x => x.Id == id);
        if (item == null) throw new ArgumentException($"Bảng giá không tồn tại: {id}");
        return _mapper.Map<DetailPriceTableResponse>(item);
    }

    public async Task CreateAsync(CreatePriceTableRequest request)
    {
        try
        {
            var entity = _mapper.Map<PriceTable>(request);
            var ranges = request.TimeRanges ?? new List<PriceTimeRangeDto>();
            entity.TimeRanges = ranges
                .Where(r => r != null)
                .Select(r => new PriceTimeRange { StartTime = r.StartTime, EndTime = r.EndTime })
                .ToList();
            _context.Add(entity);
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            var msg = ex.InnerException?.Message ?? ex.Message;
            throw new ApiException($"Create price table failed: {msg}", System.Net.HttpStatusCode.BadRequest);
        }
    }

    public async Task UpdateAsync(UpdatePriceTableRequest request)
    {
        try
        {
            var entity = await _context.Set<PriceTable>().Include(x => x.TimeRanges).FirstOrDefaultAsync(x => x.Id == request.Id);
            if (entity == null) throw new ArgumentException($"Bảng giá không tồn tại: {request.Id}");
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
                    throw new ApiException("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc", System.Net.HttpStatusCode.BadRequest);
                }
            }

            // replace ranges explicitly
            _context.RemoveRange(entity.TimeRanges);
            await _context.SaveChangesAsync();
            entity.TimeRanges.Clear();
            entity.TimeRanges.AddRange(ranges
                .Select(r => new PriceTimeRange { PriceTableId = entity.Id, StartTime = r.StartTime, EndTime = r.EndTime }));

            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            var msg = ex.InnerException?.Message ?? ex.Message;
            throw new ApiException($"Update price table failed: {msg}", System.Net.HttpStatusCode.BadRequest);
        }
        catch (ApiException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new ApiException($"Update price table failed: {ex.Message}", System.Net.HttpStatusCode.BadRequest);
        }
    }

    public async Task DeleteAsync(DeletePriceTableRequest request)
    {
        var entity = await _context.Set<PriceTable>().FirstOrDefaultAsync(x => x.Id == request.Id);
        if (entity == null) throw new ArgumentException($"Bảng giá không tồn tại: {request.Id}");
        _context.Remove(entity);
        await _context.SaveChangesAsync();
    }

    public async Task SetProductsAsync(SetPriceTableProductsRequest request)
    {
        var table = await _context.PriceTables.Include(x => x.PriceTableProducts).FirstOrDefaultAsync(x => x.Id == request.PriceTableId);
        if (table == null) throw new ArgumentException($"Bảng giá không tồn tại: {request.PriceTableId}");

        var productIds = (request.Items ?? new List<SetPriceTableProductItem>()).Select(i => i.ProductId).ToList();
        var validIds = await _context.Products.Where(p => productIds.Contains(p.Id)).Select(p => p.Id).ToListAsync();

        table.PriceTableProducts.Clear();
        foreach (var it in request.Items ?? new List<SetPriceTableProductItem>())
        {
            if (!validIds.Contains(it.ProductId)) continue;
            table.PriceTableProducts.Add(new PriceTableProduct
            {
                PriceTableId = table.Id,
                ProductId = it.ProductId,
                OverrideSalePrice = it.OverrideSalePrice,
            });
        }
        await _context.SaveChangesAsync();
    }

    public async Task<ListPriceTableProductsResponse> GetProductsAsync(int priceTableId)
    {
        var items = await _context.PriceTableProducts
            .Where(x => x.PriceTableId == priceTableId)
            .Select(x => new PriceTableProductItem { ProductId = x.ProductId, OverrideSalePrice = x.OverrideSalePrice })
            .ToListAsync();
        return new ListPriceTableProductsResponse { PriceTableId = priceTableId, Items = items };
    }

    public async Task UpdateStatusAsync(int id, bool isActive)
    {
        var entity = await _context.PriceTables.FirstOrDefaultAsync(x => x.Id == id);
        if (entity == null) throw new ArgumentException($"Bảng giá không tồn tại: {id}");
        entity.IsActive = isActive;
        await _context.SaveChangesAsync();
    }
} 
using ApiApplication.Data;
using ApiApplication.Dtos.InventoryCheck;
using ApiApplication.Entities;
using ApiApplication.Exceptions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class InventoryCheckService(ApplicationDbContext context, IMapper mapper) : IInventoryCheckService
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
                    TotalDeltaIncrease = x.Items.Sum(i => i.ActualQuantity > i.SystemQuantity ? i.ActualQuantity - i.SystemQuantity : 0),
                    TotalDeltaDecrease = x.Items.Sum(i => i.SystemQuantity > i.ActualQuantity ? i.SystemQuantity - i.ActualQuantity : 0),
                    TotalDelta = x.Items.Sum(i => i.ActualQuantity - i.SystemQuantity)
                })
                .ToListAsync();

            return result;
        }
        catch (Exception ex)
        {
            throw new ApiException($"List inventory checks failed: {ex.Message}", System.Net.HttpStatusCode.InternalServerError);
        }
    }

    public async Task<DetailInventoryCheckResponse> DetailAsync(int id)
    {
        try
        {
            var entity = await _context.InventoryChecks
                .Include(x => x.Items)
                .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
            {
                throw new ApiException($"Phiếu kiểm kho không tồn tại: {id}", System.Net.HttpStatusCode.NotFound);
            }
            return _mapper.Map<DetailInventoryCheckResponse>(entity);
        }
        catch (Exception ex)
        {
            throw new ApiException($"Detail inventory check failed: {ex.Message}", System.Net.HttpStatusCode.InternalServerError);
        }
    }

    public async Task<int> CreateAsync(CreateInventoryCheckRequest request)
    {
        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var existingProducts = await _context.Products.Where(p => productIds.Contains(p.Id)).Select(p => p.Id).ToListAsync();
        var missing = productIds.Except(existingProducts).ToList();
        if (missing.Count > 0)
        {
            throw new ApiException($"Sản phẩm không tồn tại: {string.Join(",", missing)}", System.Net.HttpStatusCode.BadRequest);
        }

        var entity = _mapper.Map<InventoryCheck>(request);
        entity.Code = await GenerateNextCodeAsync();
        entity.Items = request.Items.Select(i => _mapper.Map<InventoryCheckItem>(i)).ToList();

        _context.InventoryChecks.Add(entity);
        await _context.SaveChangesAsync();
        return entity.Id;
    }

    private async Task<string> GenerateNextCodeAsync()
    {
        var last = await _context.InventoryChecks.OrderByDescending(x => x.Id).Select(x => x.Code).FirstOrDefaultAsync();
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
        var entity = await _context.InventoryChecks
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
        {
            throw new ApiException($"Phiếu kiểm kho không tồn tại: {id}", System.Net.HttpStatusCode.NotFound);
        }

        // Cập nhật thông tin cơ bản
        entity.CheckTime = request.CheckTime;
        entity.Note = request.Note;
        
        // Xử lý các items
        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var existingProducts = await _context.Products
            .Where(p => productIds.Contains(p.Id))
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
        entity.Items = request.Items.Select(i => new InventoryCheckItem
        {
            InventoryCheckId = id,
            ProductId = i.ProductId,
            SystemQuantity = i.SystemQuantity,
            ActualQuantity = i.ActualQuantity
        }).ToList();

        await _context.SaveChangesAsync();
    }

    public async Task CancelAsync(int id)
    {
        var entity = await _context.InventoryChecks
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
        {
            throw new ApiException($"Phiếu kiểm kho không tồn tại: {id}", System.Net.HttpStatusCode.NotFound);
        }

        entity.Status = Entities.Shared.InventoryCheckStatus.Cancelled;
        await _context.SaveChangesAsync();
    }

    public async Task<List<int>> BulkCancelAsync(List<int> ids)
    {
        var entities = await _context.InventoryChecks
            .Where(x => ids.Contains(x.Id))
            .ToListAsync();

        var cancelledIds = entities.Select(x => x.Id).ToList();

        foreach (var entity in entities)
        {
            entity.Status = Entities.Shared.InventoryCheckStatus.Cancelled;
        }

        await _context.SaveChangesAsync();
        return cancelledIds;
    }
} 
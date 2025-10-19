using ApiApplication.Data;
using ApiApplication.Dtos.Cashflow;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class CashflowService(ApplicationDbContext context, IMapper mapper) : ICashflowService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;

    private static string GenerateVoucherCode(string typeCode, int id)
    {
        return $"{typeCode}{id.ToString("D6")}";
    }

    public async Task<CashflowResponse[]> ListAsync(ListCashflowRequest request)
    {
        var query = _context.Cashflows.Include(x => x.CashflowType).AsQueryable();

        if (request.IsPayment.HasValue)
        {
            query = query.Where(x => x.IsPayment == request.IsPayment.Value);
        }
        if (request.From.HasValue)
        {
            query = query.Where(x => x.Time >= request.From.Value);
        }
        if (request.To.HasValue)
        {
            query = query.Where(x => x.Time <= request.To.Value);
        }
        if (request.CashflowTypeId.HasValue)
        {
            query = query.Where(x => x.CashflowTypeId == request.CashflowTypeId.Value);
        }
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            query = query.Where(x => x.Status == request.Status);
        }

        var items = await query
            .OrderByDescending(x => x.Time)
            // .Skip((request.Page - 1) * request.PageSize)
            // .Take(request.PageSize)
            .ProjectTo<CashflowResponse>(_mapper.ConfigurationProvider)
            .ToArrayAsync();

        return items;
    }

    public async Task<CashflowResponse?> DetailAsync(DetailCashflowRequest request)
    {
        var query = _context
            .Cashflows.Include(x => x.CashflowType)
            .Where(x => x.ReferenceNumber == request.ReferenceNumber);

        return await query
            .ProjectTo<CashflowResponse>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync();
    }

    public async Task<int> CreateCashflowAsync(CreateCashflowRequest request)
    {
        if (request.Value <= 0)
        {
            throw new ApiException("Giá trị phiếu quỹ phải lớn hơn 0");
        }
        if (request.Time.HasValue && request.Time.Value > DateTime.Now)
        {
            throw new ApiException("Thời gian phiếu quỹ không được lớn hơn thời gian hiện tại");
        }
        {
            request.Time = DateTime.Now;
        }
        var type = await _context.CashflowTypes.FirstOrDefaultAsync(t =>
            t.Id == request.CashflowTypeId && t.IsPayment == request.IsPayment
        );
        if (type == null)
        {
            throw new ApiException("Loại thu/chi không tồn tại");
        }

        var entity = _mapper.Map<Cashflow>(request);
        if (request.IsPayment)
        {
            entity.Value = -Math.Abs(entity.Value);
        }
        else
        {
            entity.Value = Math.Abs(request.Value);
        }

        // Dùng code của loại thu/chi
        entity.ReferenceNumber = GenerateVoucherCode(type.Code, entity.Id);
        _context.Cashflows.Add(entity);
        await _context.SaveChangesAsync();
        return entity.Id;
    }

    public async Task UpdateAsync(UpdateCashflowRequest request)
    {
        if (request.Value <= 0)
        {
            throw new ApiException("Giá trị phiếu quỹ phải lớn hơn 0");
        }
        if (request.Time.HasValue && request.Time.Value > DateTime.Now)
        {
            throw new ApiException("Thời gian phiếu quỹ không được lớn hơn thời gian hiện tại");
        }

        var entity = await _context.Cashflows.FirstOrDefaultAsync(x => x.Id == request.Id);
        var type = await _context.CashflowTypes.FirstOrDefaultAsync(t =>
            t.Id == request.CashflowTypeId && t.IsPayment == request.IsPayment
        );
        if (entity == null)
        {
            throw new ApiException("Phiếu quỹ không tồn tại");
        }
        if (type == null)
        {
            throw new ApiException("Loại thu/chi không tồn tại");
        }

        _mapper.Map(request, entity);
        entity.ReferenceNumber = GenerateVoucherCode(type.Code, entity.Id);
        if (request.IsPayment)
        {
            entity.Value = -Math.Abs(entity.Value);
        }
        else
        {
            entity.Value = Math.Abs(request.Value);
        }
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _context.Cashflows.FirstOrDefaultAsync(x => x.Id == id);
        if (entity == null)
        {
            return; // idempotent
        }
        _context.Cashflows.Remove(entity);
        await _context.SaveChangesAsync();
    }
}

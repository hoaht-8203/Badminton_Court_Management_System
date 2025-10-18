using ApiApplication.Data;
using ApiApplication.Dtos.Cashflow;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;

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
        var query = _context.Cashflows
            .Include(x => x.CashflowType)
            .AsQueryable();

        if (request.IsPayment.HasValue)
        {
            query = query.Where(x => x.IsPayment == request.IsPayment.Value);
        }
        if (request.PaymentMethod.HasValue)
        {
            query = query.Where(x => x.PaymentMethod == request.PaymentMethod.Value);
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
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ProjectTo<CashflowResponse>(_mapper.ConfigurationProvider)
            .ToArrayAsync();

        return items;
    }

    public async Task<CashflowResponse?> DetailAsync(DetailCashflowRequest request)
    {
        var query = _context.Cashflows
            .Include(x => x.CashflowType)
            .Where(x => x.ReferenceNumber == request.ReferenceNumber);

        return await query
            .ProjectTo<CashflowResponse>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync();
    }

    public async Task<int> CreateReceiptAsync(CreateCashflowRequest request)
    {
        var type = await _context.CashflowTypes.FirstOrDefaultAsync(t => t.Id == request.CashflowTypeId);
        if (type == null)
        {
            throw new InvalidOperationException("Loại thu/chi không tồn tại");
        }

        var entity = _mapper.Map<Cashflow>(request);
        entity.IsPayment = false;
        entity.CashflowTypeId = type.Id;
        entity.CashflowType = type;
        entity.Status = CashFlowStatus.Pending;
        entity.Time = request.Time ?? DateTime.UtcNow;

        var (valid, error) = CashflowValidationService.ValidateAndNormalize(entity);
        if (!valid)
        {
            throw new InvalidOperationException(error ?? "Dữ liệu không hợp lệ");
        }

        _context.Cashflows.Add(entity);
        await _context.SaveChangesAsync();

        // Dùng code của loại thu/chi
        entity.ReferenceNumber = GenerateVoucherCode(type.Code, entity.Id);
        await _context.SaveChangesAsync();
        return entity.Id;
    }

    public async Task<int> CreatePaymentAsync(CreateCashflowRequest request)
    {
        var type = await _context.CashflowTypes.FirstOrDefaultAsync(t => t.Id == request.CashflowTypeId);
        if (type == null)
        {
            throw new InvalidOperationException("Loại thu/chi không tồn tại");
        }

        var entity = _mapper.Map<Cashflow>(request);
        entity.IsPayment = true;
        entity.CashflowTypeId = type.Id;
        entity.CashflowType = type;
        entity.Status = CashFlowStatus.Pending;
        entity.Time = request.Time ?? DateTime.UtcNow;

        var (valid, error) = CashflowValidationService.ValidateAndNormalize(entity);
        if (!valid)
        {
            throw new InvalidOperationException(error ?? "Dữ liệu không hợp lệ");
        }

        _context.Cashflows.Add(entity);
        await _context.SaveChangesAsync();

        // Dùng code của loại thu/chi
        entity.ReferenceNumber = GenerateVoucherCode(type.Code, entity.Id);
        await _context.SaveChangesAsync();
        return entity.Id;
    }

    public async Task UpdateAsync(UpdateCashflowRequest request)
    {
        var entity = await _context.Cashflows.Include(x => x.CashflowType).FirstOrDefaultAsync(x => x.Id == request.Id);
        if (entity == null)
        {
            throw new InvalidOperationException("Không tìm thấy phiếu quỹ");
        }

        var type = await _context.CashflowTypes.FirstOrDefaultAsync(t => t.Id == request.CashflowTypeId);
        if (type == null)
        {
            throw new InvalidOperationException("Loại thu/chi không tồn tại");
        }

        entity.CashflowTypeId = type.Id;
        entity.CashflowType = type;
        _mapper.Map(request, entity);
        if (request.Time.HasValue) entity.Time = request.Time.Value;
        if (!string.IsNullOrWhiteSpace(request.Status)) entity.Status = request.Status!;

        var (valid, error) = CashflowValidationService.ValidateAndNormalize(entity);
        if (!valid)
        {
            throw new InvalidOperationException(error ?? "Dữ liệu không hợp lệ");
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



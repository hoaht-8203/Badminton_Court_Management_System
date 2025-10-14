using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos.Service;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class ServiceService(ApplicationDbContext context, IMapper mapper) : IServiceService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;

    public async Task<List<ListServiceResponse>> ListServiceAsync(ListServiceRequest request)
    {
        var query = _context.Services.Include(s => s.ServicePricingRules).AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            query = query.Where(s => s.Name.ToLower().Contains(request.Name.ToLower()));
        }
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            query = query.Where(s => s.Status == request.Status);
        }

        query = query.OrderByDescending(s => s.CreatedAt);
        var services = await query.ToListAsync();
        return _mapper.Map<List<ListServiceResponse>>(services);
    }

    public async Task<DetailServiceResponse> DetailServiceAsync(DetailServiceRequest request)
    {
        var service = await _context
            .Services.Include(s => s.ServicePricingRules)
            .FirstOrDefaultAsync(s => s.Id == request.Id);

        if (service == null)
        {
            throw new ApiException(
                $"Không tìm thấy dịch vụ với ID: {request.Id}",
                HttpStatusCode.BadRequest
            );
        }

        return _mapper.Map<DetailServiceResponse>(service);
    }

    public async Task<DetailServiceResponse> CreateServiceAsync(CreateServiceRequest request)
    {
        // Validate unique name
        if (await _context.Services.AnyAsync(s => s.Name == request.Name))
        {
            throw new ApiException(
                $"Tên dịch vụ {request.Name} đã được sử dụng",
                HttpStatusCode.BadRequest
            );
        }

        // Validate linked product if provided
        if (request.LinkedProductId.HasValue)
        {
            var exists = await _context.Products.AnyAsync(p =>
                p.Id == request.LinkedProductId.Value
            );
            if (!exists)
            {
                throw new ApiException("LinkedProductId không tồn tại", HttpStatusCode.BadRequest);
            }
        }

        var entity = _mapper.Map<Service>(request);
        entity.Status = ServiceStatus.Active;

        // Create pricing rule from request via mapper
        var pricingRule = _mapper.Map<ServicePricingRule>(request);
        pricingRule.Service = entity;
        pricingRule.ServiceId = entity.Id;
        entity.ServicePricingRules.Add(pricingRule);

        var created = await _context.Services.AddAsync(entity);
        await _context.SaveChangesAsync();

        var reloaded = await _context
            .Services.Include(s => s.ServicePricingRules)
            .FirstAsync(s => s.Id == created.Entity.Id);
        return _mapper.Map<DetailServiceResponse>(reloaded);
    }

    public async Task<DetailServiceResponse> UpdateServiceAsync(UpdateServiceRequest request)
    {
        var service = await _context
            .Services.Include(s => s.ServicePricingRules)
            .FirstOrDefaultAsync(s => s.Id == request.Id);

        if (service == null)
        {
            throw new ApiException(
                $"Không tìm thấy dịch vụ với ID: {request.Id}",
                HttpStatusCode.BadRequest
            );
        }

        if (!string.IsNullOrEmpty(request.Name) && request.Name != service.Name)
        {
            var isExist = await _context.Services.AnyAsync(s =>
                s.Name == request.Name && s.Id != request.Id
            );
            if (isExist)
            {
                throw new ApiException(
                    $"Tên dịch vụ {request.Name} đã được sử dụng",
                    HttpStatusCode.BadRequest
                );
            }
        }

        _mapper.Map(request, service);

        // Validate linked product if provided
        if (request.LinkedProductId.HasValue)
        {
            var exists = await _context.Products.AnyAsync(p =>
                p.Id == request.LinkedProductId.Value
            );
            if (!exists)
            {
                throw new ApiException("LinkedProductId không tồn tại", HttpStatusCode.BadRequest);
            }
        }

        if (request.PricePerHour.HasValue)
        {
            var rule = service.ServicePricingRules.FirstOrDefault();
            if (rule == null)
            {
                rule = _mapper.Map<ServicePricingRule>(
                    new UpdateServicePricingRuleRequest
                    {
                        ServiceId = service.Id,
                        PricePerHour = request.PricePerHour.Value,
                    }
                );
                rule.Id = Guid.NewGuid();
                rule.Service = service;
                service.ServicePricingRules.Add(rule);
            }
            else
            {
                _mapper.Map(
                    new UpdateServicePricingRuleRequest
                    {
                        ServiceId = service.Id,
                        PricePerHour = request.PricePerHour.Value,
                    },
                    rule
                );
            }

            // Enforce single pricing rule invariant
            if (service.ServicePricingRules.Count > 1)
            {
                var keep = service.ServicePricingRules.First();
                var extras = service.ServicePricingRules.Skip(1).ToList();
                foreach (var extra in extras)
                {
                    _context.ServicePricingRules.Remove(extra);
                }
                service.ServicePricingRules.Clear();
                service.ServicePricingRules.Add(keep);
            }
        }

        await _context.SaveChangesAsync();
        return _mapper.Map<DetailServiceResponse>(service);
    }

    public async Task<bool> DeleteServiceAsync(DeleteServiceRequest request)
    {
        var service = await _context.Services.FirstOrDefaultAsync(s => s.Id == request.Id);
        if (service == null)
        {
            throw new ApiException(
                $"Không tìm thấy dịch vụ với ID: {request.Id}",
                HttpStatusCode.BadRequest
            );
        }

        service.Status = ServiceStatus.Deleted;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<DetailServiceResponse> ChangeServiceStatusAsync(
        ChangeServiceStatusRequest request
    )
    {
        var service = await _context.Services.FirstOrDefaultAsync(s => s.Id == request.Id);
        if (service == null)
        {
            throw new ApiException("Dịch vụ không tồn tại", HttpStatusCode.BadRequest);
        }

        if (!request.IsValidStatus())
        {
            throw new ApiException(
                $"Trạng thái không hợp lệ: {request.Status}. Trạng thái hợp lệ là: Active, Inactive, Deleted",
                HttpStatusCode.BadRequest
            );
        }

        service.Status = request.Status;
        await _context.SaveChangesAsync();
        return _mapper.Map<DetailServiceResponse>(service);
    }
}

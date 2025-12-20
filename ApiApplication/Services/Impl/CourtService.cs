using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos.Court;
using ApiApplication.Dtos.Customer;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using ApiApplication.Sessions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class CourtService(ApplicationDbContext context, IMapper mapper, ICurrentUser currentUser)
    : ICourtService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly ICurrentUser _currentUser = currentUser;

    public async Task<List<ListCourtResponse>> ListCourtsAsync(ListCourtRequest request)
    {
        var query = _context
            .Courts.Include(c => c.CourtArea)
            .Include(c => c.CourtPricingRules.OrderBy(r => r.Order))
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            query = query.Where(c => c.Name.ToLower().Contains(request.Name.ToLower()));
        }
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            query = query.Where(c => c.Status == request.Status);
        }
        if (request.CourtAreaId is not null)
        {
            query = query.Where(c => c.CourtAreaId == request.CourtAreaId);
        }

        query = query.OrderByDescending(c => c.CreatedAt);
        var courts = await query.ToListAsync();
        return _mapper.Map<List<ListCourtResponse>>(courts);
    }

    public async Task<DetailCourtResponse> DetailCourtAsync(DetailCourtRequest request)
    {
        var courts = await _context
            .Courts.Include(c => c.CourtPricingRules.OrderBy(r => r.Order))
            .Include(c => c.CourtArea)
            .FirstOrDefaultAsync(c => c.Id == request.Id);

        if (courts == null)
        {
            throw new ApiException(
                $"Không tìm thấy sân với ID: {request.Id}",
                HttpStatusCode.BadRequest
            );
        }

        return _mapper.Map<DetailCourtResponse>(courts);
    }

    public async Task<DetailCourtResponse> CreateCourtAsync(CreateCourtRequest request)
    {
        if (
            await _context.Courts.AnyAsync(c =>
                c.CourtAreaId == request.CourtAreaId && EF.Functions.ILike(c.Name, request.Name)
            )
        )
        {
            throw new ApiException(
                $"Tên sân {request.Name} đã được sử dụng bởi sân khác",
                HttpStatusCode.BadRequest
            );
        }

        var court = _mapper.Map<Court>(request);
        court.Status = CourtStatus.Active;

        // Map pricing rules and set CourtId
        foreach (var pricingRuleRequest in request.CourtPricingRules)
        {
            var pricingRule = _mapper.Map<CourtPricingRules>(pricingRuleRequest);
            pricingRule.CourtId = court.Id;
            court.CourtPricingRules.Add(pricingRule);
        }

        var newCourt = await _context.Courts.AddAsync(court);
        await _context.SaveChangesAsync();

        // Reload the court with pricing rules for response
        var createdCourt = await _context
            .Courts.Include(c => c.CourtPricingRules.OrderBy(r => r.Order))
            .Include(c => c.CourtArea)
            .FirstOrDefaultAsync(c => c.Id == newCourt.Entity.Id);

        return _mapper.Map<DetailCourtResponse>(createdCourt);
    }

    public async Task<DetailCourtResponse> UpdateCourtAsync(UpdateCourtRequest request)
    {
        var court = await _context
            .Courts.Include(c => c.CourtPricingRules.OrderBy(r => r.Order))
            .FirstOrDefaultAsync(c => c.Id == request.Id);

        if (court == null)
        {
            throw new ApiException(
                $"Không tìm thấy sân với ID: {request.Id}",
                HttpStatusCode.BadRequest
            );
        }

        if (court.Status == CourtStatus.InUse)
        {
            throw new ApiException(
                "Sân đang được sử dụng, không thể cập nhật",
                HttpStatusCode.BadRequest
            );
        }

        if (!string.IsNullOrEmpty(request.Name) && request.Name != court.Name)
        {
            var isExist = await _context.Courts.AnyAsync(c =>
                c.Name == request.Name && c.CourtAreaId == request.CourtAreaId && c.Id != request.Id
            );

            if (isExist)
            {
                throw new ApiException(
                    $"Tên sân {request.Name} đã được sử dụng bởi sân khác",
                    HttpStatusCode.BadRequest
                );
            }
        }

        // Update basic court information
        _mapper.Map(request, court);
        var oldRules = court.CourtPricingRules.ToList();
        foreach (var rule in oldRules)
        {
            _context.CourtPricingRules.Remove(rule);
        }

        // --- Add new pricing rules ---
        foreach (var pricingRuleRequest in request.CourtPricingRules)
        {
            var pricingRule = _mapper.Map<CourtPricingRules>(pricingRuleRequest);
            pricingRule.CourtId = court.Id;
            _context.CourtPricingRules.Add(pricingRule);
        }

        await _context.SaveChangesAsync();

        return _mapper.Map<DetailCourtResponse>(court);
    }

    public async Task<bool> DeleteCourtAsync(DeleteCourtRequest request)
    {
        var courts = await _context.Courts.FirstOrDefaultAsync(c => c.Id == request.Id);

        if (courts == null)
        {
            throw new ApiException(
                $"Không tìm thấy sân với ID: {request.Id}",
                HttpStatusCode.BadRequest
            );
        }

        courts.Status = CourtStatus.Deleted;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<DetailCourtResponse> ChangeCourtStatusAsync(ChangeCourtStatusRequest request)
    {
        var courts = await _context.Courts.FirstOrDefaultAsync(c => c.Id == request.Id);

        if (courts == null)
        {
            throw new ApiException("Sân không tồn tại", HttpStatusCode.BadRequest);
        }

        if (!request.IsValidStatus())
        {
            throw new ApiException(
                $"Trạng thái không hợp lệ: {request.Status}. Trạng thái hợp lệ là: Active, Inactive, Deleted",
                HttpStatusCode.BadRequest
            );
        }

        if (courts.Status == CourtStatus.InUse)
        {
            throw new ApiException(
                "Sân đang được sử dụng, không thẻ thay đổi trạng thái",
                HttpStatusCode.BadRequest
            );
        }

        courts.Status = request.Status;

        await _context.SaveChangesAsync();

        return _mapper.Map<DetailCourtResponse>(courts);
    }

    public async Task<CourtPricingRuleTemplateDto> CreateCourtPricingRuleTemplateAsync(
        CreateCourtPricingRuleTemplateRequest request
    )
    {
        foreach (var dayOfWeek in request.DaysOfWeek)
        {
            if (dayOfWeek < 2 || dayOfWeek > 8)
            {
                throw new ApiException(
                    "Các ngày trong tuần phải là từ 2 đến 8",
                    HttpStatusCode.BadRequest
                );
            }
        }

        if (request.StartTime >= request.EndTime)
        {
            throw new ApiException(
                "Thời gian bắt đầu phải trước thời gian kết thúc.",
                HttpStatusCode.BadRequest
            );
        }

        request.DaysOfWeek = [.. request.DaysOfWeek.OrderBy(d => d)];

        var courtPricingRuleTemplate = _mapper.Map<CourtPricingRuleTemplate>(request);
        await _context.CourtPricingRuleTemplates.AddAsync(courtPricingRuleTemplate);
        await _context.SaveChangesAsync();
        return _mapper.Map<CourtPricingRuleTemplateDto>(courtPricingRuleTemplate);
    }

    public async Task<List<CourtPricingRuleTemplateDto>> ListCourtPricingRuleTemplatesAsync()
    {
        var courtPricingRuleTemplates = await _context
            .CourtPricingRuleTemplates.OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
        return _mapper.Map<List<CourtPricingRuleTemplateDto>>(courtPricingRuleTemplates);
    }

    public async Task<CourtPricingRuleTemplateDto> UpdateCourtPricingRuleTemplateAsync(
        UpdateCourtPricingRuleTemplateRequest request
    )
    {
        var courtPricingRuleTemplate =
            await _context.CourtPricingRuleTemplates.FirstOrDefaultAsync(c => c.Id == request.Id)
            ?? throw new ApiException(
                $"Không tìm thấy template giá sân với ID: {request.Id}",
                HttpStatusCode.BadRequest
            );

        _mapper.Map(request, courtPricingRuleTemplate);
        await _context.SaveChangesAsync();
        return _mapper.Map<CourtPricingRuleTemplateDto>(courtPricingRuleTemplate);
    }

    public async Task DeleteCourtPricingRuleTemplateAsync(
        DeleteCourtPricingRuleTemplateRequest request
    )
    {
        var courtPricingRuleTemplate =
            await _context.CourtPricingRuleTemplates.FirstOrDefaultAsync(c => c.Id == request.Id)
            ?? throw new ApiException(
                $"Không tìm thấy template giá sân với ID: {request.Id}",
                HttpStatusCode.BadRequest
            );

        _context.CourtPricingRuleTemplates.Remove(courtPricingRuleTemplate);
        await _context.SaveChangesAsync();
    }

    public async Task<List<ListCourtGroupByCourtAreaResponse>> ListCourtGroupByCourtAreaAsync()
    {
        var courtAreas = await _context.CourtAreas.Include(c => c.Courts).ToListAsync();

        foreach (var courtArea in courtAreas)
        {
            courtArea.Courts = courtArea.Courts.OrderByDescending(c => c.CreatedAt).ToList();
        }
        return _mapper.Map<List<ListCourtGroupByCourtAreaResponse>>(courtAreas);
    }

    public async Task<
        List<ListCourtPricingRuleByCourtIdResponse>
    > ListCourtPricingRuleByCourtIdAsync(ListCourtPricingRuleByCourtIdRequest request)
    {
        var courtPricingRules = await _context
            .CourtPricingRules.Where(c => c.CourtId == request.CourtId)
            .OrderBy(r => r.Order)
            .ToListAsync();
        return _mapper.Map<List<ListCourtPricingRuleByCourtIdResponse>>(courtPricingRules);
    }
}

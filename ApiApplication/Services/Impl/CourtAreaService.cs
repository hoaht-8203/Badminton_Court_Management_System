using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos.Court;
using ApiApplication.Dtos.CourtArea;
using ApiApplication.Entities;
using ApiApplication.Exceptions;
using ApiApplication.Sessions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class CourtAreaService(
    ApplicationDbContext context,
    IMapper mapper,
    ICurrentUser currentUser
) : ICourtAreaService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly ICurrentUser _currentUser = currentUser;

    public async Task<List<ListCourtAreaResponse>> ListCourtAreasAsync()
    {
        var query = await _context.CourtAreas.OrderByDescending(c => c.CreatedAt).ToListAsync();
        return _mapper.Map<List<ListCourtAreaResponse>>(query);
    }

    public async Task<DetailCourtAreaResponse> DetailCourtAreaAsync(DetailCourtAreaRequest request)
    {
        var courtArea = await _context.CourtAreas.FirstOrDefaultAsync(c => c.Id == request.Id);
        if (courtArea == null)
        {
            throw new ApiException(
                $"Không tìm thấy sân với ID: {request.Id}",
                HttpStatusCode.BadRequest
            );
        }
        return _mapper.Map<DetailCourtAreaResponse>(courtArea);
    }

    public async Task<DetailCourtAreaResponse> CreateCoutAreaAsync(CreateCourtAreaRequest request)
    {
        var existingCourtArea = await _context.CourtAreas.FirstOrDefaultAsync(c =>
            c.Name == request.Name
        );
        if (existingCourtArea != null)
        {
            throw new ApiException(
                $"Tên {request.Name} đã được sử dụng bởi sân khác",
                HttpStatusCode.BadRequest
            );
        }

        var courtArea = _mapper.Map<CourtArea>(request);
        _context.CourtAreas.Add(courtArea);
        await _context.SaveChangesAsync();
        return _mapper.Map<DetailCourtAreaResponse>(courtArea);
    }

    public async Task<DetailCourtAreaResponse> UpdateCourtAreaAsync(UpdateCourtAreaRequest request)
    {
        var entity = await _context.CourtAreas.FirstOrDefaultAsync(c => c.Id == request.Id);
        if (entity == null)
        {
            throw new ApiException(
                $"Không tìm thấy sân với ID: {request.Id}",
                HttpStatusCode.BadRequest
            );
        }

        var nameUsedByOther = await _context.CourtAreas.AnyAsync(c =>
            c.Id != request.Id && c.Name == request.Name
        );
        if (nameUsedByOther)
        {
            throw new ApiException(
                $"Tên {request.Name} đã được sử dụng bởi sân khác",
                HttpStatusCode.BadRequest
            );
        }

        entity.Name = request.Name;
        await _context.SaveChangesAsync();
        return _mapper.Map<DetailCourtAreaResponse>(entity);
    }

    public async Task DeleteCourtAreaAsync(DeletCourtAreaRequest request)
    {
        var entity = await _context.CourtAreas.FirstOrDefaultAsync(c => c.Id == request.Id);
        if (entity == null)
        {
            throw new ApiException(
                $"Không tìm thấy sân với ID: {request.Id}",
                HttpStatusCode.BadRequest
            );
        }

        var hasCourts = await _context.Courts.AnyAsync(c => c.CourtAreaId == request.Id);
        if (hasCourts)
        {
            throw new ApiException(
                "Sân đang được sử dụng bởi một hoặc nhiều sân",
                HttpStatusCode.BadRequest
            );
        }

        _context.CourtAreas.Remove(entity);
        await _context.SaveChangesAsync();
    }
}

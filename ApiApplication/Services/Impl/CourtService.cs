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
            .Include(c => c.PriceUnit)
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
        var courts = await _context.Courts.FirstOrDefaultAsync(c => c.Id == request.Id);

        if (courts == null)
        {
            throw new ArgumentException($"Not found customer with ID: {request.Id}");
        }

        return _mapper.Map<DetailCourtResponse>(courts);
    }

    public async Task<DetailCourtResponse> CreateCourtAsync(CreateCourtRequest request)
    {
        if (
            await _context.Courts.AnyAsync(c =>
                c.Name == request.Name && c.CourtAreaId == request.CourtAreaId
            )
        )
        {
            throw new ArgumentException($"Court name {request.Name} already exists in this area");
        }

        var court = _mapper.Map<Court>(request);
        court.Status = CourtStatus.Active;

        _context.Courts.Add(court);
        await _context.SaveChangesAsync();
        return _mapper.Map<DetailCourtResponse>(court);
    }

    public async Task<DetailCourtResponse> UpdateCourtAsync(UpdateCourtRequest request)
    {
        var court = await _context.Courts.FirstOrDefaultAsync(c => c.Id == request.Id);
        if (court == null)
        {
            throw new ArgumentException($"Not found court with ID: {request.Id}");
        }

        if (!string.IsNullOrEmpty(request.Name) && request.Name != court.Name)
        {
            var isExist = await _context.Courts.AnyAsync(c =>
                c.Name == request.Name && c.CourtAreaId == request.CourtAreaId && c.Id != request.Id
            );

            if (isExist)
            {
                throw new ArgumentException(
                    $"Court name {request.Name} already exists in this area"
                );
            }
        }

        _mapper.Map(request, court);
        await _context.SaveChangesAsync();
        return _mapper.Map<DetailCourtResponse>(court);
    }

    public async Task<bool> DeleteCourtAsync(DeleteCourtRequest request)
    {
        var courts = await _context.Courts.FirstOrDefaultAsync(c => c.Id == request.Id);

        if (courts == null)
        {
            throw new ArgumentException($"Not found court with ID: {request.Id}");
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
            throw new ApiException("Customer does not exist", HttpStatusCode.BadRequest);
        }

        if (!request.IsValidStatus())
        {
            throw new ApiException(
                $"Invalid status: {request.Status}. Valid statuses are: Active, Inactive, Deleted",
                HttpStatusCode.BadRequest
            );
        }

        courts.Status = request.Status;

        await _context.SaveChangesAsync();

        return _mapper.Map<DetailCourtResponse>(courts);
    }
}

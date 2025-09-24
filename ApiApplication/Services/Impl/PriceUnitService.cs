using ApiApplication.Data;
using ApiApplication.Dtos.PriceUnit;
using ApiApplication.Entities;
using ApiApplication.Exceptions;
using ApiApplication.Sessions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class PriceUnitService(
    ApplicationDbContext context,
    IMapper mapper,
    ICurrentUser currentUser
) : IPriceUnitService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly ICurrentUser _currentUser = currentUser;

    public async Task<List<ListPriceUnitResponse>> ListPriceUnitsAsync()
    {
        var query = await _context.PriceUnits.OrderByDescending(c => c.CreatedAt).ToListAsync();
        return _mapper.Map<List<ListPriceUnitResponse>>(query);
    }

    public async Task<DetailPriceUnitResponse> DetailPriceUnitAsync(DetailPriceUnitRequest request)
    {
        var entity = await _context.PriceUnits.FirstOrDefaultAsync(x => x.Id == request.Id);
        if (entity == null)
        {
            throw new ArgumentException($"Not found price unit with ID: {request.Id}");
        }
        return _mapper.Map<DetailPriceUnitResponse>(entity);
    }

    public async Task<DetailPriceUnitResponse> CreatePriceUnitAsync(CreatePriceUnitRequest request)
    {
        var exists = await _context.PriceUnits.AnyAsync(x => x.Name == request.Name);
        if (exists)
        {
            throw new ArgumentException($"Name {request.Name} has been used by other price unit");
        }

        var entity = _mapper.Map<PriceUnit>(request);
        _context.PriceUnits.Add(entity);
        await _context.SaveChangesAsync();
        return _mapper.Map<DetailPriceUnitResponse>(entity);
    }

    public async Task<DetailPriceUnitResponse> UpdatePriceUnitAsync(UpdatePriceUnitRequest request)
    {
        var entity = await _context.PriceUnits.FirstOrDefaultAsync(x => x.Id == request.Id);
        if (entity == null)
        {
            throw new ArgumentException($"Not found price unit with ID: {request.Id}");
        }

        var nameUsed = await _context.PriceUnits.AnyAsync(x =>
            x.Id != request.Id && x.Name == request.Name
        );
        if (nameUsed)
        {
            throw new ArgumentException($"Name {request.Name} has been used by other price unit");
        }

        _mapper.Map(request, entity);
        await _context.SaveChangesAsync();
        return _mapper.Map<DetailPriceUnitResponse>(entity);
    }

    public async Task DeletePriceUnitAsync(DeletePriceUnitRequest request)
    {
        var entity = await _context.PriceUnits.FirstOrDefaultAsync(x => x.Id == request.Id);
        if (entity == null)
        {
            throw new ArgumentException($"Not found price unit with ID: {request.Id}");
        }

        // var inUse = await _context.Courts.AnyAsync(c => c.PriceUnitId == request.Id);
        // if (inUse)
        // {
        //     throw new ApiException(
        //         "Price unit is currently used by one or more courts",
        //         System.Net.HttpStatusCode.BadRequest
        //     );
        // }

        _context.PriceUnits.Remove(entity);
        await _context.SaveChangesAsync();
    }
}

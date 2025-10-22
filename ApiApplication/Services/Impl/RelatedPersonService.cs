using ApiApplication.Data;
using ApiApplication.Dtos.RelationPerson;
using ApiApplication.Entities;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class RelatedPersonService(ApplicationDbContext context, IMapper mapper) : IRelatedPersonService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;

    public async Task<RelatedPersonResponse[]> ListAsync(ListRelatedPersonRequest request)
    {
        var query = _context.RelatedPeople.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            query = query.Where(x =>
                x.Name.Contains(request.Keyword) ||
                (x.Phone != null && x.Phone.Contains(request.Keyword)) ||
                (x.Email != null && x.Email.Contains(request.Keyword)) ||
                (x.Company != null && x.Company.Contains(request.Keyword)));
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(x => x.IsActive == request.IsActive.Value);
        }

        var items = await query
            .OrderBy(x => x.Name)
            .ProjectTo<RelatedPersonResponse>(_mapper.ConfigurationProvider)
            .ToArrayAsync();

        return items;
    }

    public async Task<RelatedPersonResponse?> DetailAsync(DetailRelatedPersonRequest request)
    {
        return await _context.RelatedPeople
            .Where(x => x.Id == request.Id)
            .ProjectTo<RelatedPersonResponse>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync();
    }

    public async Task<int> CreateAsync(CreateRelatedPersonRequest request)
    {
        var entity = _mapper.Map<RelatedPerson>(request);
        _context.RelatedPeople.Add(entity);
        await _context.SaveChangesAsync();
        return entity.Id;
    }

    public async Task UpdateAsync(UpdateRelatedPersonRequest request)
    {
        var entity = await _context.RelatedPeople.FirstOrDefaultAsync(x => x.Id == request.Id);
        if (entity == null)
        {
            throw new InvalidOperationException("Không tìm thấy người liên quan");
        }

        _mapper.Map(request, entity);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _context.RelatedPeople.FirstOrDefaultAsync(x => x.Id == id);
        if (entity == null) return;
        _context.RelatedPeople.Remove(entity);
        await _context.SaveChangesAsync();
    }
}

using ApiApplication.Data;
using ApiApplication.Dtos;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class SalaryFormService(
    ApplicationDbContext context,
    IMapper mapper
) : ISalaryFormService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;

    public async Task CreateSalaryFormAsync(SalaryFormRequest request)
    {
        var entity = _mapper.Map<Entities.SalaryForm>(request);
        _context.SalaryForms.Add(entity);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateSalaryFormAsync(int id, SalaryFormRequest request)
    {
        var entity = await _context.SalaryForms.FindAsync(id);
        if (entity == null)
            throw new Exception($"SalaryForm with Id {id} not found");
        _mapper.Map(request, entity);
        _context.SalaryForms.Update(entity);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteSalaryFormAsync(int id)
    {
        var entity = await _context.SalaryForms.FindAsync(id);
        if (entity == null)
            throw new Exception($"SalaryForm with Id {id} not found");
        _context.SalaryForms.Remove(entity);
        await _context.SaveChangesAsync();
    }

    public async Task<SalaryFormResponse?> GetSalaryFormByIdAsync(int id)
    {
        var entity = await _context.SalaryForms.FindAsync(id);
        if (entity == null) return null;
        return _mapper.Map<SalaryFormResponse>(entity);
    }

    public async Task<List<SalaryFormResponse>> GetAllSalaryFormsAsync()
    {
        var entities = await _context.SalaryForms.ToListAsync();
        return entities.Select(e => _mapper.Map<SalaryFormResponse>(e)).ToList();
    }
}

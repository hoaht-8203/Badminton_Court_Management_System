using ApiApplication.Data;
using ApiApplication.Dtos;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class ShiftService(
    ApplicationDbContext context,
    IMapper mapper
) : IShiftService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;

    public async Task CreateShiftAsync(ShiftRequest request)
    {
        var shift = _mapper.Map<Entities.Shift>(request);
        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateShiftAsync(int id, ShiftRequest request)
    {
        var shift = await _context.Shifts.FindAsync(id);
        if (shift == null)
            throw new Exception($"Shift with Id {id} not found");
        _mapper.Map(request, shift);
        _context.Shifts.Update(shift);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteShiftAsync(int id)
    {
        var shift = await _context.Shifts.FindAsync(id);
        if (shift == null)
            throw new Exception($"Shift with Id {id} not found");
        _context.Shifts.Remove(shift);
        await _context.SaveChangesAsync();
    }

    public async Task<ShiftResponse?> GetShiftByIdAsync(int id)
    {
        var shift = await _context.Shifts.FindAsync(id);
        if (shift == null) return null;
        return _mapper.Map<ShiftResponse>(shift);
    }

    public async Task<List<ShiftResponse>> GetAllShiftsAsync()
    {
        var shifts = await _context.Shifts.ToListAsync();
        return shifts.Select(s => _mapper.Map<ShiftResponse>(s)).ToList();
    }
}

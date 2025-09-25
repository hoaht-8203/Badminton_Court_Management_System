using ApiApplication.Exceptions;
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
        // Check for overlapping shifts
        if (IsTimeOverlap(request.StartTime, request.EndTime))
            throw new ApiException(
                "Lỗi: Thời gian làm việc bị trùng.",
                System.Net.HttpStatusCode.BadRequest
            );
        // Create and save the new shift
        var shift = _mapper.Map<Entities.Shift>(request);
        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateShiftAsync(int id, ShiftRequest request)
    {
        // Check for overlapping shifts excluding the current shift
        if (IsTimeOverlap(request.StartTime, request.EndTime, id))
            throw new ApiException(
                "Lỗi: Thời gian làm việc bị trùng.",
                System.Net.HttpStatusCode.BadRequest
            );
        var shift = await _context.Shifts.FindAsync(id);
        if (shift == null)
            throw new ApiException(
                $"Ca làm việc với Id {id} không tồn tại",
                System.Net.HttpStatusCode.NotFound
            );
        _mapper.Map(request, shift);
        _context.Shifts.Update(shift);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteShiftAsync(int id)
    {
        var shift = await _context.Shifts.FindAsync(id);
        if (shift == null)
            throw new ApiException(
                $"Ca làm việc với Id {id} không tồn tại",
                System.Net.HttpStatusCode.NotFound
            );
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
        var shifts = await _context.Shifts.OrderBy(s => s.StartTime).ToListAsync();
        return shifts.Select(s => _mapper.Map<ShiftResponse>(s)).ToList();
    }
    public bool IsTimeOverlap(TimeOnly startTime, TimeOnly endTime, int? excludeId = null)
    {
        return _context.Shifts.Any(s =>
            (excludeId == null || s.Id != excludeId) &&
            ((startTime < s.EndTime && endTime > s.StartTime) || startTime == s.StartTime || endTime == s.EndTime)
        );
    }
}

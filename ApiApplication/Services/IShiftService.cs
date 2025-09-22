using System.Collections.Generic;
using System.Threading.Tasks;
using ApiApplication.Dtos;

namespace ApiApplication.Services;

public interface IShiftService
{
    Task CreateShiftAsync(ShiftRequest request);
    Task UpdateShiftAsync(int id, ShiftRequest request);
    Task DeleteShiftAsync(int id);
    Task<ShiftResponse?> GetShiftByIdAsync(int id);
    Task<List<ShiftResponse>> GetAllShiftsAsync();
}

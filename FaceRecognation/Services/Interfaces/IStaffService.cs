using System.Collections.Generic;
using System.Threading.Tasks;
using FaceRecognation.Dtos;

namespace FaceRecognation.Services.Interfaces
{
    public interface IStaffService
    {
        Task<List<StaffResponseDto>> GetAllAsync(ListStaffRequestDto request);
        Task<StaffResponseDto?> GetByIdAsync(int id);
        Task CreateAsync(StaffRequestDto request);
        Task UpdateAsync(int id, StaffRequestDto request);
        Task ChangeStatusAsync(ChangeStaffStatusRequestDto request);
        Task DeleteAsync(int id);
    }
}

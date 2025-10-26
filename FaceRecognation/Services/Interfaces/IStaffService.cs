using System.Collections.Generic;
using System.Threading.Tasks;
using FaceRecognation.Dtos;

namespace FaceRecognation.Services.Interfaces
{
    public interface IStaffService
    {
        Task<List<StaffResponse>> GetAllAsync(ListStaffRequest request);
        Task<StaffResponse?> GetByIdAsync(int id);
        Task CreateAsync(StaffRequest request);
        Task UpdateAsync(int id, StaffRequest request);
        Task ChangeStatusAsync(ChangeStaffStatusRequest request);
        Task DeleteAsync(int id);
    }
}

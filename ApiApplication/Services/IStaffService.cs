namespace ApiApplication.Services
{
    public interface IStaffService
    {
    Task UpdateStaffAsync(Dtos.StaffRequest request, int id);
    Task CreateStaffAsync(Dtos.StaffRequest request);
        Task DeleteStaffAsync(int staffId);
        Task<Dtos.StaffResponse?> GetStaffByIdAsync(int staffId);
        Task<List<Dtos.StaffResponse>> GetAllStaffAsync();
    }
}
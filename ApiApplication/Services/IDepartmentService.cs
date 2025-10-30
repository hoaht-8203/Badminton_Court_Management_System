namespace ApiApplication.Services;

public interface IDepartmentService
{
    Task CreateDepartmentAsync(Dtos.DepartmentRequest request);
    Task UpdateDepartmentAsync(Dtos.DepartmentRequest request, int id);
    Task DeleteDepartmentAsync(int departmentId);
    Task<Dtos.DepartmentResponse?> GetDepartmentByIdAsync(int departmentId);
    Task<List<Dtos.DepartmentResponse>> GetAllDepartmentsAsync(Dtos.ListDepartmentRequest request);
}

using System.Collections.Generic;
using System.Threading.Tasks;
using ApiApplication.Dtos;

namespace ApiApplication.Services;

public interface ISalaryFormService
{
    Task CreateSalaryFormAsync(SalaryFormRequest request);
    Task UpdateSalaryFormAsync(int id, SalaryFormRequest request);
    Task DeleteSalaryFormAsync(int id);
    Task<SalaryFormResponse?> GetSalaryFormByIdAsync(int id);
    Task<List<SalaryFormResponse>> GetAllSalaryFormsAsync();
}

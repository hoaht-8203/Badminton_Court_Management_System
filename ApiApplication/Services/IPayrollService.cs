using ApiApplication.Dtos.Payroll;
using ApiApplication.Entities;

namespace ApiApplication.Services;

public interface IPayrollService
{
    Task<bool> CreatePayrollAsync(CreatePayrollRequest request);
    Task<List<ListPayrollResponse>> GetPayrollsAsync(ListPayrollRequest? request = null);
    Task<bool> RefreshPayrollAsync(int payrollId);
    Task<bool> RefreshPayrollAsync();
    Task<PayrollDetailResponse?> GetPayrollByIdAsync(int payrollId);
    Task<List<PayrollItemResponse>> GetPayrollItemsByPayrollIdAsync(int payrollId);
    Task<List<PayrollItemResponse>> GetPayrollItemsByStaffIdAsync(int staffId);
    Task<bool> PayPayrollItemAsync(int payrollItemId, decimal amount);
    Task<bool> DeletePayrollAsync(int payrollId);
}

using System;
using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos.Payroll;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using ApiApplication.Helpers;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class PayrollService : IPayrollService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    public PayrollService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }
    public async Task<bool> CreatePayrollAsync(CreatePayrollRequest request)
    {
        var newPayroll = _mapper.Map<Payroll>(request);

        var staffs = await _context.Staffs.ToListAsync();

        var payrollItems = new List<PayrollItem>();
        foreach (var staff in staffs)
        {
            var attendance = await _context.AttendanceRecords
            .Where(
                a => a.StaffId == staff.Id
                && a.Date >= request.StartDate
                && a.Date <= request.EndDate
            )
            .Distinct()
            .ToListAsync();

            if (attendance.Count == 0) continue;

            decimal totalSalary = SalaryHelper.CalculateSalary(staff, attendance);

            payrollItems.Add(new PayrollItem
            {
                StaffId = staff.Id,
                NetSalary = totalSalary,
                PaidAmount = 0,
                Status = PayrollStatus.Pending,
                Note = ""
            });
        }
        newPayroll.PayrollItems = payrollItems;
        newPayroll.TotalNetSalary = payrollItems.Sum(pi => pi.NetSalary);
        newPayroll.TotalPaidAmount = payrollItems.Sum(pi => pi.PaidAmount);

        _context.Payrolls.Add(newPayroll);
        var result = await _context.SaveChangesAsync();
        if (result <= 0) throw new ApiException("Tạo bảng lương thất bại", HttpStatusCode.InternalServerError);

        return true;
    }

    public async Task<List<ListPayrollResponse>> GetPayrollsAsync()
    {
        var payrolls = await _context.Payrolls.Include(p => p.PayrollItems).ToListAsync();
        return _mapper.Map<List<ListPayrollResponse>>(payrolls);
        
    }

    public async Task<bool> RefreshPayrollAsync(int payrollId)
    {
        var payroll = await _context.Payrolls
            .Include(p => p.PayrollItems)
            .FirstOrDefaultAsync(p => p.Id == payrollId);

        if (payroll == null) return false;

        var staffs = await _context.Staffs.ToListAsync();

        var payrollItems = new List<PayrollItem>();
        foreach (var staff in staffs)
        {
            var attendance = await _context.AttendanceRecords
            .Where(
                a => a.StaffId == staff.Id
                && a.Date >= payroll.StartDate
                && a.Date <= payroll.EndDate
            )
            .Distinct()
            .ToListAsync();

            if (attendance.Count == 0) continue;

            decimal totalSalary = SalaryHelper.CalculateSalary(staff, attendance);

            var existingPayrollItem = payroll.PayrollItems.FirstOrDefault(pi => pi.StaffId == staff.Id);
            if (existingPayrollItem != null)
            {
                existingPayrollItem.NetSalary = totalSalary;
                existingPayrollItem.Status = existingPayrollItem.PaidAmount >= totalSalary ? PayrollStatus.Completed : PayrollStatus.Pending;
                existingPayrollItem.Note = "";
            }
            else
            {
                payrollItems.Add(new PayrollItem
                {
                    StaffId = staff.Id,
                    NetSalary = totalSalary,
                    PaidAmount = 0,
                    Status = PayrollStatus.Pending,
                    Note = ""
                });
            }
        }
        payroll.PayrollItems = payroll.PayrollItems.Concat(payrollItems).ToList();
        payroll.TotalNetSalary = payroll.PayrollItems.Sum(pi => pi.NetSalary);
        payroll.TotalPaidAmount = payroll.PayrollItems.Sum(pi => pi.PaidAmount);
        payroll.Status = payroll.TotalPaidAmount >= payroll.TotalNetSalary ? PayrollStatus.Completed : PayrollStatus.Pending;
        _context.Payrolls.Update(payroll);
        var result = await _context.SaveChangesAsync();

        if (result <= 0) throw new ApiException("Cập nhật bảng lương thất bại", HttpStatusCode.InternalServerError);
        return true;
    }

    public async Task<PayrollDetailResponse?> GetPayrollByIdAsync(int payrollId)
    {
        var payroll = await _context.Payrolls
            .Include(p => p.PayrollItems)
            .FirstOrDefaultAsync(p => p.Id == payrollId);

        if (payroll == null) return null;

        return _mapper.Map<PayrollDetailResponse>(payroll);
    }

    public async Task<List<PayrollItemResponse>> GetPayrollItemsByPayrollIdAsync(int payrollId)
    {
        var payrollItems = await _context.PayrollItems
            .Where(pi => pi.PayrollId == payrollId)
            .ToListAsync();

        return _mapper.Map<List<PayrollItemResponse>>(payrollItems);
    }

    public async Task<bool> PayPayrollItemAsync(int payrollItemId, decimal amount)
    {
        var payrollItem = await _context.PayrollItems.FindAsync(payrollItemId);
        if (payrollItem == null) throw new ApiException("Phiếu lương không tồn tại", HttpStatusCode.NotFound);
        if (amount <= 0) throw new ApiException("Số tiền thanh toán phải lớn hơn 0", HttpStatusCode.BadRequest);
        if (payrollItem.PaidAmount + amount > payrollItem.NetSalary)
            throw new ApiException("Số tiền thanh toán vượt quá số tiền còn lại", HttpStatusCode.BadRequest);
        payrollItem.PaidAmount += amount;
        payrollItem.Status = payrollItem.PaidAmount >= payrollItem.NetSalary ? PayrollStatus.Completed : PayrollStatus.Pending;

        _context.PayrollItems.Update(payrollItem);
        var result = await _context.SaveChangesAsync();

        if (result <= 0) throw new ApiException("Cập nhật bảng lương thất bại", HttpStatusCode.InternalServerError);
        return true;
    }
}

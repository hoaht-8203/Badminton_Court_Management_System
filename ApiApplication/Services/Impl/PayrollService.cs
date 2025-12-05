using System;
using System.Net;
using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Dtos.Cashflow;
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
    private readonly ICashflowService _cashflowService;

    public PayrollService(
        ApplicationDbContext context,
        IMapper mapper,
        ICashflowService cashflowService
    )
    {
        _context = context;
        _mapper = mapper;
        _cashflowService = cashflowService;
        
        // Initialize SalaryHelper with context
        SalaryHelper.Initialize(context);
    }

    public async Task<bool> CreatePayrollAsync(CreatePayrollRequest request)
    {
        // Validate: EndDate must be >= StartDate
        if (request.EndDate < request.StartDate)
        {
            throw new ApiException(
                "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
                HttpStatusCode.BadRequest
            );
        }

        var newPayroll = _mapper.Map<Payroll>(request);

        var staffs = await _context.Staffs.ToListAsync();

        var payrollItems = new List<PayrollItem>();
        foreach (var staff in staffs)
        {
            var attendance = await _context
                .AttendanceRecords.Where(a =>
                    a.StaffId == staff.Id
                    && a.Date >= request.StartDate
                    && a.Date <= request.EndDate
                )
                .Distinct()
                .ToListAsync();

            if (attendance.Count == 0)
                continue;

            var schedules = await _context
                .Schedules.Where(s =>
                    s.StaffId == staff.Id
                    && (
                        (
                            s.IsFixedShift
                            && s.StartDate <= request.EndDate
                            && (s.EndDate == null || s.EndDate >= request.StartDate)
                        )
                        || (
                            !s.IsFixedShift
                            && s.StartDate >= request.StartDate
                            && s.StartDate <= request.EndDate
                        )
                    )
                )
                .Include(s => s.Shift)
                .Include(s => s.Staff)
                .ToListAsync();
            if (schedules.Count == 0)
                continue;

            var standardizedSchedules = ScheduleHelper.StandardizeSchedule(
                schedules,
                request.StartDate,
                request.EndDate,
                _mapper
            );

            // Remove cancelled shifts from standardized schedules
            var cancelledShifts = await _context
                .CancelledShifts.Where(cs =>
                    cs.StaffId == staff.Id
                    && cs.Date >= request.StartDate
                    && cs.Date <= request.EndDate
                )
                .ToListAsync();

            standardizedSchedules = standardizedSchedules
                .Where(s =>
                    !cancelledShifts.Any(cs =>
                        cs.StaffId == s.Staff.Id
                        && cs.ShiftId == s.Shift.Id
                        && cs.Date == DateOnly.FromDateTime(s.Date)
                    )
                )
                .ToList();

            decimal totalSalary = SalaryHelper.CalculateSalary(
                staff,
                attendance,
                standardizedSchedules
            );
            if (totalSalary <= 0)
                continue;

            payrollItems.Add(
                new PayrollItem
                {
                    StaffId = staff.Id,
                    NetSalary = totalSalary,
                    PaidAmount = 0,
                    Status = PayrollStatus.Pending,
                    Note = "",
                }
            );
        }
        newPayroll.PayrollItems = payrollItems;
        newPayroll.TotalNetSalary = payrollItems.Sum(pi => pi.NetSalary);
        newPayroll.TotalPaidAmount = payrollItems.Sum(pi => pi.PaidAmount);

        _context.Payrolls.Add(newPayroll);
        var result = await _context.SaveChangesAsync();
        if (result <= 0)
            throw new ApiException("Tạo bảng lương thất bại", HttpStatusCode.InternalServerError);

        return true;
    }

    public async Task<List<ListPayrollResponse>> GetPayrollsAsync(ListPayrollRequest? request = null)
    {
        var query = _context
            .Payrolls.Include(p => p.PayrollItems)
            .ThenInclude(pi => pi.Staff)
            .AsQueryable();

        // Filter by keyword (name or code)
        if (!string.IsNullOrWhiteSpace(request?.Keyword))
        {
            var keyword = $"%{request.Keyword.Trim()}%";
            var keywordTrimmed = request.Keyword.Trim();
            
            // Try to extract ID from keyword (e.g., "BL000001" or "1" -> 1)
            int? extractedId = null;
            var keywordLower = keywordTrimmed.ToLower();
            if (keywordLower.StartsWith("bl"))
            {
                var idPart = keywordTrimmed.Substring(2).TrimStart('0');
                if (int.TryParse(idPart, out var id))
                {
                    extractedId = id;
                }
            }
            else if (int.TryParse(keywordTrimmed, out var directId))
            {
                extractedId = directId;
            }

            if (extractedId.HasValue)
            {
                query = query.Where(p =>
                    (p.Name != null && EF.Functions.ILike(p.Name, keyword))
                    || p.Id == extractedId.Value
                );
            }
            else
            {
                query = query.Where(p => p.Name != null && EF.Functions.ILike(p.Name, keyword));
            }
        }

        // Filter by status
        if (!string.IsNullOrWhiteSpace(request?.Status))
        {
            query = query.Where(p => p.Status == request.Status);
        }

        // Filter by start date with operator (>, =, <)
        if (!string.IsNullOrWhiteSpace(request?.StartDateOperator) && request?.StartDate.HasValue == true)
        {
            var startDate = DateOnly.FromDateTime(request.StartDate.Value);
            var dateOperator = request.StartDateOperator.Trim();
            
            if (dateOperator == ">")
            {
                query = query.Where(p => p.StartDate > startDate);
            }
            else if (dateOperator == "=")
            {
                query = query.Where(p => p.StartDate == startDate);
            }
            else if (dateOperator == "<")
            {
                query = query.Where(p => p.StartDate < startDate);
            }
        }

        // Filter by end date with operator (>, =, <)
        if (!string.IsNullOrWhiteSpace(request?.EndDateOperator) && request?.EndDate.HasValue == true)
        {
            var endDate = DateOnly.FromDateTime(request.EndDate.Value);
            var dateOperator = request.EndDateOperator.Trim();
            
            if (dateOperator == ">")
            {
                query = query.Where(p => p.EndDate > endDate);
            }
            else if (dateOperator == "=")
            {
                query = query.Where(p => p.EndDate == endDate);
            }
            else if (dateOperator == "<")
            {
                query = query.Where(p => p.EndDate < endDate);
            }
        }

        var payrolls = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return _mapper.Map<List<ListPayrollResponse>>(payrolls);
    }

    public async Task<bool> RefreshPayrollAsync(int payrollId)
    {
        var payroll = await _context
            .Payrolls.Include(p => p.PayrollItems)
            .FirstOrDefaultAsync(p => p.Id == payrollId);

        if (payroll == null)
            throw new ApiException("Bảng lương không tồn tại", HttpStatusCode.NotFound);

        var today = DateOnly.FromDateTime(DateTime.Now);
        bool isEnded = payroll.EndDate < today;

        // If payroll has ended, only recalculate totals from existing items, don't recalculate salaries
        if (isEnded)
        {
            // Update status of each PayrollItem based on current PaidAmount and NetSalary
            foreach (var item in payroll.PayrollItems)
            {
                item.Status = item.PaidAmount >= item.NetSalary
                    ? PayrollStatus.Completed
                    : PayrollStatus.Pending;
            }
            
            // Recalculate totals from existing PayrollItems only
            payroll.TotalNetSalary = payroll.PayrollItems.Sum(pi => pi.NetSalary);
            payroll.TotalPaidAmount = payroll.PayrollItems.Sum(pi => pi.PaidAmount);
            payroll.Status = payroll.TotalPaidAmount >= payroll.TotalNetSalary
                ? PayrollStatus.Completed
                : PayrollStatus.Pending;
            
            _context.Payrolls.Update(payroll);
            var saveResult = await _context.SaveChangesAsync();
            
            if (saveResult <= 0)
                throw new ApiException(
                    "Cập nhật bảng lương thất bại",
                    HttpStatusCode.InternalServerError
                );
            return true;
        }

        var staffs = await _context.Staffs.ToListAsync();

        var payrollItems = new List<PayrollItem>();
        foreach (var staff in staffs)
        {
            var attendance = await _context
                .AttendanceRecords.Where(a =>
                    a.StaffId == staff.Id
                    && a.Date >= payroll.StartDate
                    && a.Date <= payroll.EndDate
                )
                .Distinct()
                .ToListAsync();

            if (attendance.Count == 0)
                continue;
            var schedules = await _context
                .Schedules.Where(s =>
                    s.StaffId == staff.Id
                    && (
                        (
                            s.IsFixedShift
                            && s.StartDate <= payroll.EndDate
                            && (s.EndDate == null || s.EndDate >= payroll.StartDate)
                        )
                        || (
                            !s.IsFixedShift
                            && s.StartDate >= payroll.StartDate
                            && s.StartDate <= payroll.EndDate
                        )
                    )
                )
                .Include(s => s.Shift)
                .Include(s => s.Staff)
                .ToListAsync();
            if (schedules.Count == 0)
                continue;

            var standardizedSchedules = ScheduleHelper.StandardizeSchedule(
                schedules,
                payroll.StartDate,
                payroll.EndDate,
                _mapper
            );

            // Remove cancelled shifts from standardized schedules
            var cancelledShifts = await _context
                .CancelledShifts.Where(cs =>
                    cs.StaffId == staff.Id
                    && cs.Date >= payroll.StartDate
                    && cs.Date <= payroll.EndDate
                )
                .ToListAsync();

            standardizedSchedules = standardizedSchedules
                .Where(s =>
                    !cancelledShifts.Any(cs =>
                        cs.StaffId == s.Staff.Id
                        && cs.ShiftId == s.Shift.Id
                        && cs.Date == DateOnly.FromDateTime(s.Date)
                    )
                )
                .ToList();

            decimal totalSalary = SalaryHelper.CalculateSalary(
                staff,
                attendance,
                standardizedSchedules
            );

            var existingPayrollItem = payroll.PayrollItems.FirstOrDefault(pi =>
                pi.StaffId == staff.Id
            );
            if (existingPayrollItem != null)
            {
                existingPayrollItem.NetSalary = totalSalary;
                existingPayrollItem.Status =
                    existingPayrollItem.PaidAmount >= totalSalary
                        ? PayrollStatus.Completed
                        : PayrollStatus.Pending;
                existingPayrollItem.Note = "";
            }
            else
            {
                payrollItems.Add(
                    new PayrollItem
                    {
                        StaffId = staff.Id,
                        NetSalary = totalSalary,
                        PaidAmount = 0,
                        Status = PayrollStatus.Pending,
                        Note = "",
                    }
                );
            }
        }
        payroll.PayrollItems = payroll.PayrollItems.Concat(payrollItems).ToList();
        payroll.TotalNetSalary = payroll.PayrollItems.Sum(pi => pi.NetSalary);
        payroll.TotalPaidAmount = payroll.PayrollItems.Sum(pi => pi.PaidAmount);
        payroll.Status =
            payroll.TotalPaidAmount >= payroll.TotalNetSalary
                ? PayrollStatus.Completed
                : PayrollStatus.Pending;
        _context.Payrolls.Update(payroll);
        var result = await _context.SaveChangesAsync();

        if (result <= 0)
            throw new ApiException(
                "Cập nhật bảng lương thất bại",
                HttpStatusCode.InternalServerError
            );
        return true;
    }

    public async Task<bool> RefreshPayrollAsync()
    {
        var payrolls = await _context.Payrolls.ToListAsync();
        var today = DateOnly.FromDateTime(DateTime.Now);
        var payrollsToRefresh = new List<Payroll>();

        foreach (var payroll in payrolls)
        {
            // Only refresh payrolls that haven't ended yet (endDate >= today)
            if (payroll.EndDate >= today)
            {
                payrollsToRefresh.Add(payroll);
            }
        }

        foreach (var payroll in payrollsToRefresh)
        {
            await RefreshPayrollAsync(payroll.Id);
        }
        return true;
    }

    public async Task<PayrollDetailResponse?> GetPayrollByIdAsync(int payrollId)
    {
        var payroll = await _context
            .Payrolls.Include(p => p.PayrollItems)
            .ThenInclude(pi => pi.Staff)
            .FirstOrDefaultAsync(p => p.Id == payrollId);

        if (payroll == null)
            return null;
        var payrollItemIds = payroll.PayrollItems.Select(pi => pi.Id.ToString()).ToHashSet();
        var response = _mapper.Map<PayrollDetailResponse>(payroll);
        
        // Get all cashflows matching the criteria first, then filter by payrollItemIds in memory
        var allCashflows = await _context
            .Cashflows.Where(c =>
                c.RelatedId != null
                && c.PersonType == RelatedPeopleGroup.Staff
                && c.CashflowTypeId == CashflowTypeIdMapping.PayStaff
            )
            .ToListAsync();
        
        // Filter in memory using HashSet for O(1) lookup
        response.Cashflows = allCashflows
            .Where(c => payrollItemIds.Contains(c.RelatedId))
            .Select(c => _mapper.Map<CashflowResponse>(c))
            .ToList();
        return response;
    }

    public async Task<List<PayrollItemResponse>> GetPayrollItemsByPayrollIdAsync(int payrollId)
    {
        var payrollItems = await _context
            .PayrollItems.Where(pi => pi.PayrollId == payrollId)
            .ToListAsync();

        return _mapper.Map<List<PayrollItemResponse>>(payrollItems);
    }

    public async Task<List<PayrollItemResponse>> GetPayrollItemsByStaffIdAsync(int staffId)
    {
        var payrollItems = await _context
            .PayrollItems.Where(pi => pi.StaffId == staffId)
            .Include(pi => pi.Staff)
            .Include(pi => pi.Payroll)
            .ToListAsync();

        return _mapper.Map<List<PayrollItemResponse>>(payrollItems);
    }

    public async Task<bool> PayPayrollItemAsync(int payrollItemId, decimal amount)
    {
        var payrollItem = await _context
            .PayrollItems.Where(p => p.Id == payrollItemId)
            .Include(pi => pi.Staff)
            .FirstOrDefaultAsync();
        if (payrollItem == null)
            throw new ApiException("Phiếu lương không tồn tại", HttpStatusCode.NotFound);
        // if (amount <= 0)
        //     throw new ApiException("Số tiền thanh toán phải lớn hơn 0", HttpStatusCode.BadRequest);
        if (payrollItem.PaidAmount + amount > payrollItem.NetSalary)
            throw new ApiException(
                "Số tiền thanh toán vượt quá số tiền còn lại",
                HttpStatusCode.BadRequest
            );
        payrollItem.PaidAmount += amount;
        payrollItem.Status =
            payrollItem.PaidAmount >= payrollItem.NetSalary
                ? PayrollStatus.Completed
                : PayrollStatus.Pending;

        _context.PayrollItems.Update(payrollItem);
        var result = await _context.SaveChangesAsync();

        //TODO: add cashflow entry for payroll payment
        try
        {
            var cashflowEntry = new CreateCashflowRequest
            {
                CashflowTypeId = CashflowTypeIdMapping.PayStaff, // Set appropriate CashflowTypeId for payroll payment
                IsPayment = true,
                // payroll payment is an outflow -> send negative value
                Value = -Math.Abs(amount),
                Note = $"Thanh toán phiếu lương cho nhân viên {payrollItem.Staff?.FullName ?? ""}",
                RelatedId = payrollItem.Id.ToString(),
                PersonType = RelatedPeopleGroup.Staff,
                RelatedPerson = payrollItem.Staff?.FullName,
            };
            await _cashflowService.CreateCashflowAsync(cashflowEntry);
        }
        catch (System.Exception)
        {
            throw new ApiException("Tạo phiếu quỹ thất bại", HttpStatusCode.InternalServerError);
        }

        // Recalculate payroll totals after payment
        var payroll = await _context
            .Payrolls.Include(p => p.PayrollItems)
            .FirstOrDefaultAsync(p => p.Id == payrollItem.PayrollId);
        
        if (payroll != null)
        {
            payroll.TotalNetSalary = payroll.PayrollItems.Sum(pi => pi.NetSalary);
            payroll.TotalPaidAmount = payroll.PayrollItems.Sum(pi => pi.PaidAmount);
            payroll.Status = payroll.TotalPaidAmount >= payroll.TotalNetSalary
                ? PayrollStatus.Completed
                : PayrollStatus.Pending;
            _context.Payrolls.Update(payroll);
            await _context.SaveChangesAsync();
        }

        return true;
    }

    public async Task<bool> DeletePayrollAsync(int payrollId)
    {
        var payroll = await _context
            .Payrolls.Include(p => p.PayrollItems)
            .FirstOrDefaultAsync(p => p.Id == payrollId);

        if (payroll == null)
            throw new ApiException("Bảng lương không tồn tại", HttpStatusCode.NotFound);

        // Check if payroll has no items
        if (payroll.PayrollItems == null || payroll.PayrollItems.Count == 0)
        {
            // Delete payroll if it has no items
            _context.Payrolls.Remove(payroll);
            await _context.SaveChangesAsync();
            return true;
        }

        // Check if all payroll items are unpaid (PaidAmount = 0)
        var hasPaidItems = payroll.PayrollItems.Any(pi => pi.PaidAmount > 0);
        if (hasPaidItems)
        {
            throw new ApiException(
                "Không thể hủy bảng lương. Bảng lương đã có phiếu lương được thanh toán. Chỉ có thể hủy khi tất cả phiếu lương chưa được thanh toán hoặc bảng lương không có phiếu lương nào.",
                HttpStatusCode.BadRequest
            );
        }

        // Get all payroll item IDs to delete related cashflows
        var payrollItemIds = payroll.PayrollItems.Select(pi => pi.Id.ToString()).ToList();

        // Delete related cashflows
        var relatedCashflows = await _context
            .Cashflows.Where(c =>
                c.RelatedId != null
                && payrollItemIds.Contains(c.RelatedId)
                && c.PersonType == RelatedPeopleGroup.Staff
                && c.CashflowTypeId == CashflowTypeIdMapping.PayStaff
            )
            .ToListAsync();

        if (relatedCashflows.Any())
        {
            _context.Cashflows.RemoveRange(relatedCashflows);
        }

        // Delete all payroll items
        _context.PayrollItems.RemoveRange(payroll.PayrollItems);

        // Delete payroll
        _context.Payrolls.Remove(payroll);

        var result = await _context.SaveChangesAsync();
        if (result <= 0)
            throw new ApiException(
                "Xóa bảng lương thất bại",
                HttpStatusCode.InternalServerError
            );

        return true;
    }
}

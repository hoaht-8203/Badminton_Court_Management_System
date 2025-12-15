using System.Text.Json;
using ApiApplication.Dtos;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Data;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Helpers;

public static class SalaryHelper
{
    private static ApplicationDbContext? _context;

    public static void Initialize(ApplicationDbContext context)
    {
        _context = context;
    }

    public static decimal CalculateSalary(
        Staff staff,
        List<AttendanceRecord> attendances,
        List<ScheduleResponse> schedules
    )
    {
        var totalSalary = 0m;

        var salarySettings = JsonSerializer.Deserialize<Dictionary<string, object>>(
            staff.SalarySettings
        );
        if (salarySettings == null || salarySettings.Count == 0)
        {
            return 0;
        }
        if (salarySettings["salaryType"].ToString() == "fixed")
        {
            //group attendances by date and count number of working days and half working days
            //8hours full day 4hours half day
            var groupedAttendances = attendances.GroupBy(a => a.Date);

            // check total hours of attendance for each day
            var workingDays = 0;
            var halfWorkingDays = 0;
            foreach (var group in groupedAttendances)
            {
                var totalHours = group.Sum(a =>
                    a.CheckOutTime.HasValue ? (a.CheckOutTime.Value - a.CheckInTime).TotalHours : 0
                );
                if (totalHours >= 8)
                {
                    workingDays++;
                }
                else if (totalHours >= 4)
                {
                    halfWorkingDays++;
                }
            }
            if (!salarySettings.ContainsKey("salaryAmount"))
                return 0;
            decimal dailyRate = 0;
            var salaryAmountObj = salarySettings["salaryAmount"];
            if (salaryAmountObj is JsonElement elem)
            {
                if (elem.ValueKind == JsonValueKind.Number)
                    dailyRate = elem.GetDecimal() / 30;
                else if (elem.ValueKind == JsonValueKind.String)
                    dailyRate = Convert.ToDecimal(elem.GetString()) / 30;
            }
            else
            {
                dailyRate = Convert.ToDecimal(salaryAmountObj) / 30;
            }
            totalSalary = (workingDays * dailyRate) + (halfWorkingDays * dailyRate / 2);
        }
        else if (salarySettings["salaryType"].ToString() == "hourly")
        {
            var showAdvanced =
                salarySettings.ContainsKey("showAdvanced")
                && salarySettings["showAdvanced"] != null
                && salarySettings["showAdvanced"].ToString() == "True";
            if (
                showAdvanced
                && salarySettings.ContainsKey("advancedRows")
                && salarySettings["advancedRows"] != null
            )
            {
                var advancedRowsJson = salarySettings["advancedRows"].ToString();
                if (string.IsNullOrEmpty(advancedRowsJson))
                    return 0;
                var advancedRows = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(
                    advancedRowsJson
                );
                if (advancedRows == null || advancedRows.Count == 0)
                    return 0;

                foreach (var schedule in schedules)
                {
                    var attendanceForDay = attendances
                        .Where(a => a.Date == DateOnly.FromDateTime(schedule.Date))
                        .ToList();
                    var overlapAttendance = attendanceForDay
                        .Where(a =>
                            a.CheckInTime < schedule.Shift.EndTime
                            && a.CheckOutTime != null
                            && a.CheckOutTime > schedule.Shift.StartTime
                        )
                        .FirstOrDefault();
                    if (overlapAttendance == null)
                        continue;

                    var overlapStart =
                        overlapAttendance.CheckInTime > schedule.Shift.StartTime
                            ? overlapAttendance.CheckInTime
                            : schedule.Shift.StartTime;
                    var overlapEnd =
                        overlapAttendance.CheckOutTime!.Value < schedule.Shift.EndTime
                            ? overlapAttendance.CheckOutTime.Value
                            : schedule.Shift.EndTime;
                    var overlapTime = (overlapEnd - overlapStart).TotalHours;

                    // Tìm dòng config cho ca này, nếu không có thì lấy dòng đầu tiên (mặc định)
                    var row =
                        advancedRows.FirstOrDefault(r =>
                            r.ContainsKey("shiftId")
                            && r["shiftId"] != null
                            && r["shiftId"].ToString() == schedule.Shift.Id.ToString()
                        ) ?? advancedRows[0];

                    decimal rate = 0;
                    var amountObj = row.ContainsKey("amount") ? row["amount"] : null;
                    if (amountObj != null)
                    {
                        if (amountObj is JsonElement elem)
                        {
                            if (elem.ValueKind == JsonValueKind.Number)
                                rate = elem.GetDecimal();
                            else if (elem.ValueKind == JsonValueKind.String)
                                rate = Convert.ToDecimal(elem.GetString());
                        }
                        else
                        {
                            rate = Convert.ToDecimal(amountObj);
                        }
                    }
                    var factor = GetDayFactor(schedule.Date, row);
                    totalSalary += (decimal)overlapTime * rate * factor;
                }
            }
            else
            {
                if (!salarySettings.ContainsKey("salaryAmount"))
                    return 0;
                decimal hourlyRate = 0;
                var salaryAmountObj = salarySettings["salaryAmount"];
                if (salaryAmountObj is JsonElement elem)
                {
                    if (elem.ValueKind == JsonValueKind.Number)
                        hourlyRate = elem.GetDecimal();
                    else if (elem.ValueKind == JsonValueKind.String)
                        hourlyRate = Convert.ToDecimal(elem.GetString());
                }
                else
                {
                    hourlyRate = Convert.ToDecimal(salaryAmountObj);
                }
                // Tính tổng số giờ làm việc từ các ScheduleResponse có bản ghi chấm công đè lên
                foreach (var schedule in schedules)
                {
                    var attendanceForDay = attendances
                        .Where(a => a.Date == DateOnly.FromDateTime(schedule.Date))
                        .ToList();
                    var overlapAttendance = attendanceForDay
                        .Where(a =>
                            a.CheckInTime < schedule.Shift.EndTime
                            && a.CheckOutTime != null
                            && a.CheckOutTime > schedule.Shift.StartTime
                        )
                        .FirstOrDefault();
                    if (overlapAttendance == null)
                        continue;

                    var overlapStart =
                        overlapAttendance.CheckInTime > schedule.Shift.StartTime
                            ? overlapAttendance.CheckInTime
                            : schedule.Shift.StartTime;
                    var overlapEnd =
                        overlapAttendance.CheckOutTime!.Value < schedule.Shift.EndTime
                            ? overlapAttendance.CheckOutTime.Value
                            : schedule.Shift.EndTime;
                    var overlapTime = (overlapEnd - overlapStart).TotalHours;
                    totalSalary += (decimal)overlapTime * hourlyRate;
                }
            }
        }
        else if (salarySettings["salaryType"].ToString() == "shift")
        {
            var showAdvanced =
                salarySettings.ContainsKey("showAdvanced")
                && salarySettings["showAdvanced"] != null
                && salarySettings["showAdvanced"].ToString() == "True";
            if (
                showAdvanced
                && salarySettings.ContainsKey("advancedRows")
                && salarySettings["advancedRows"] != null
            )
            {
                var advancedRowsJson = salarySettings["advancedRows"].ToString();
                if (string.IsNullOrEmpty(advancedRowsJson))
                    return 0;
                var advancedRows = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(
                    advancedRowsJson
                );
                if (advancedRows == null || advancedRows.Count == 0)
                    return 0;

                foreach (var schedule in schedules)
                {
                    var attendanceForDay = attendances
                        .Where(a => a.Date == DateOnly.FromDateTime(schedule.Date))
                        .ToList();
                    var overlapAttendance = attendanceForDay
                        .Where(a =>
                            a.CheckInTime < schedule.Shift.EndTime
                            && a.CheckOutTime != null
                            && a.CheckOutTime > schedule.Shift.StartTime
                        )
                        .FirstOrDefault();
                    if (overlapAttendance == null)
                        continue;

                    // Tìm dòng config cho ca này, nếu không có thì lấy dòng đầu tiên (mặc định)
                    var row =
                        advancedRows.FirstOrDefault(r =>
                            r.ContainsKey("shiftId")
                            && r["shiftId"] != null
                            && r["shiftId"].ToString() == schedule.Shift.Id.ToString()
                        ) ?? advancedRows[0];

                    decimal rate = 0;
                    var amountObj = row.ContainsKey("amount") ? row["amount"] : null;
                    if (amountObj != null)
                    {
                        if (amountObj is JsonElement elem)
                        {
                            if (elem.ValueKind == JsonValueKind.Number)
                                rate = elem.GetDecimal();
                            else if (elem.ValueKind == JsonValueKind.String)
                                rate = Convert.ToDecimal(elem.GetString());
                        }
                        else
                        {
                            rate = Convert.ToDecimal(amountObj);
                        }
                    }
                    var factor = GetDayFactor(schedule.Date, row);
                    totalSalary += rate * factor;
                }
            }
            else
            {
                if (!salarySettings.ContainsKey("salaryAmount"))
                    return 0;
                decimal shiftRate = 0;
                var salaryAmountObj = salarySettings["salaryAmount"];
                if (salaryAmountObj is JsonElement elem)
                {
                    if (elem.ValueKind == JsonValueKind.Number)
                        shiftRate = elem.GetDecimal();
                    else if (elem.ValueKind == JsonValueKind.String)
                        shiftRate = Convert.ToDecimal(elem.GetString());
                }
                else
                {
                    shiftRate = Convert.ToDecimal(salaryAmountObj);
                }
                // Tính tổng số ca làm việc từ các ScheduleResponse có bản ghi chấm công đè lên
                foreach (var schedule in schedules)
                {
                    var attendanceForDay = attendances
                        .Where(a => a.Date == DateOnly.FromDateTime(schedule.Date))
                        .ToList();
                    var overlapAttendance = attendanceForDay
                        .Where(a =>
                            a.CheckInTime < schedule.Shift.EndTime
                            && a.CheckOutTime != null
                            && a.CheckOutTime > schedule.Shift.StartTime
                        )
                        .FirstOrDefault();
                    if (overlapAttendance != null)
                    {
                        totalSalary += shiftRate;
                    }
                }
            }
        }

        // Áp dụng giảm trừ
        var deduction = CalculateDeduction(salarySettings, attendances, schedules);
        totalSalary -= deduction;

        return totalSalary < 0 ? 0 : (int)totalSalary;
    }

    private static decimal CalculateDeduction(
        Dictionary<string, object> salarySettings,
        List<AttendanceRecord> attendances,
        List<ScheduleResponse> schedules
    )
    {
        decimal totalDeduction = 0m;

        // 1. Giảm trừ cho đi muộn
        if (
            salarySettings.ContainsKey("deductionLateMethod")
            && salarySettings.ContainsKey("deductionLateValue")
            && salarySettings.ContainsKey("deductionLateParam")
        )
        {
            var method = salarySettings["deductionLateMethod"]?.ToString();
            var valueObj = salarySettings["deductionLateValue"];
            var paramObj = salarySettings["deductionLateParam"];

            if (method != null && valueObj != null && paramObj != null)
            {
                decimal deductionValue = ParseDecimal(valueObj);
                decimal deductionParam = ParseDecimal(paramObj);

                if (method == "count")
                {
                    // Đếm số lần đi muộn
                    int lateCount = 0;
                    foreach (var schedule in schedules)
                    {
                        var attendanceForDay = attendances
                            .Where(a => a.Date == DateOnly.FromDateTime(schedule.Date))
                            .ToList();
                        var overlapAttendance = attendanceForDay
                            .Where(a =>
                                a.CheckInTime < schedule.Shift.EndTime
                                && a.CheckOutTime != null
                                && a.CheckOutTime > schedule.Shift.StartTime
                            )
                            .FirstOrDefault();

                        if (
                            overlapAttendance != null
                            && overlapAttendance.CheckInTime > schedule.Shift.StartTime
                        )
                        {
                            lateCount++;
                        }
                    }
                    // Tính tiền phạt: (số lần / param) * value
                    totalDeduction += (lateCount / deductionParam) * deductionValue;
                }
                else if (method == "minute")
                {
                    // Đếm tổng số phút đi muộn
                    int totalLateMinutes = 0;
                    foreach (var schedule in schedules)
                    {
                        var attendanceForDay = attendances
                            .Where(a => a.Date == DateOnly.FromDateTime(schedule.Date))
                            .ToList();
                        var overlapAttendance = attendanceForDay
                            .Where(a =>
                                a.CheckInTime < schedule.Shift.EndTime
                                && a.CheckOutTime != null
                                && a.CheckOutTime > schedule.Shift.StartTime
                            )
                            .FirstOrDefault();

                        if (
                            overlapAttendance != null
                            && overlapAttendance.CheckInTime > schedule.Shift.StartTime
                        )
                        {
                            var lateMinutes = (int)
                                (
                                    overlapAttendance.CheckInTime - schedule.Shift.StartTime
                                ).TotalMinutes;
                            totalLateMinutes += lateMinutes;
                        }
                    }
                    // Tính tiền phạt: (tổng phút / param) * value
                    totalDeduction += (totalLateMinutes / deductionParam) * deductionValue;
                }
            }
        }

        // 2. Giảm trừ cho về sớm
        if (
            salarySettings.ContainsKey("deductionEarlyMethod")
            && salarySettings.ContainsKey("deductionEarlyValue")
            && salarySettings.ContainsKey("deductionEarlyParam")
        )
        {
            var method = salarySettings["deductionEarlyMethod"]?.ToString();
            var valueObj = salarySettings["deductionEarlyValue"];
            var paramObj = salarySettings["deductionEarlyParam"];

            if (method != null && valueObj != null && paramObj != null)
            {
                decimal deductionValue = ParseDecimal(valueObj);
                decimal deductionParam = ParseDecimal(paramObj);

                if (method == "count")
                {
                    // Đếm số lần về sớm
                    int earlyCount = 0;
                    foreach (var schedule in schedules)
                    {
                        var attendanceForDay = attendances
                            .Where(a => a.Date == DateOnly.FromDateTime(schedule.Date))
                            .ToList();
                        var overlapAttendance = attendanceForDay
                            .Where(a =>
                                a.CheckInTime < schedule.Shift.EndTime
                                && a.CheckOutTime != null
                                && a.CheckOutTime > schedule.Shift.StartTime
                            )
                            .FirstOrDefault();

                        if (
                            overlapAttendance != null
                            && overlapAttendance.CheckOutTime.HasValue
                            && overlapAttendance.CheckOutTime.Value < schedule.Shift.EndTime
                        )
                        {
                            earlyCount++;
                        }
                    }
                    // Tính tiền phạt: (số lần / param) * value
                    totalDeduction += (earlyCount / deductionParam) * deductionValue;
                }
                else if (method == "minute")
                {
                    // Đếm tổng số phút về sớm
                    int totalEarlyMinutes = 0;
                    foreach (var schedule in schedules)
                    {
                        var attendanceForDay = attendances
                            .Where(a => a.Date == DateOnly.FromDateTime(schedule.Date))
                            .ToList();
                        var overlapAttendance = attendanceForDay
                            .Where(a =>
                                a.CheckInTime < schedule.Shift.EndTime
                                && a.CheckOutTime != null
                                && a.CheckOutTime > schedule.Shift.StartTime
                            )
                            .FirstOrDefault();

                        if (
                            overlapAttendance != null
                            && overlapAttendance.CheckOutTime.HasValue
                            && overlapAttendance.CheckOutTime.Value < schedule.Shift.EndTime
                        )
                        {
                            var earlyMinutes = (int)
                                (
                                    schedule.Shift.EndTime - overlapAttendance.CheckOutTime.Value
                                ).TotalMinutes;
                            totalEarlyMinutes += earlyMinutes;
                        }
                    }
                    // Tính tiền phạt: (tổng phút / param) * value
                    totalDeduction += (totalEarlyMinutes / deductionParam) * deductionValue;
                }
            }
        }

        // 3. Giảm trừ cho nghỉ làm
        if (salarySettings.ContainsKey("deductionAbsentValue"))
        {
            var valueObj = salarySettings["deductionAbsentValue"];
            if (valueObj != null)
            {
                decimal deductionValue = ParseDecimal(valueObj);

                // Đếm số buổi nghỉ (schedule có nhưng không có attendance hoặc attendance status = Absent)
                int absentCount = 0;
                foreach (var schedule in schedules)
                {
                    var attendanceForDay = attendances
                        .Where(a => a.Date == DateOnly.FromDateTime(schedule.Date))
                        .ToList();
                    var overlapAttendance = attendanceForDay
                        .Where(a =>
                            a.CheckInTime < schedule.Shift.EndTime
                            && a.CheckOutTime != null
                            && a.CheckOutTime > schedule.Shift.StartTime
                        )
                        .FirstOrDefault();

                    // Nếu không có attendance hoặc không có overlap thì tính là nghỉ
                    if (overlapAttendance == null)
                    {
                        absentCount++;
                    }
                }
                // Tính tiền phạt: số buổi nghỉ * value
                totalDeduction += absentCount * deductionValue;
            }
        }

        return totalDeduction;
    }

    private static decimal ParseDecimal(object value)
    {
        if (value is JsonElement elem)
        {
            if (elem.ValueKind == JsonValueKind.Number)
                return elem.GetDecimal();
            else if (elem.ValueKind == JsonValueKind.String)
                return Convert.ToDecimal(elem.GetString());
        }
        return Convert.ToDecimal(value);
    }

    private static decimal ParsePercent(string percent)
    {
        if (percent.EndsWith("%"))
        {
            if (decimal.TryParse(percent.TrimEnd('%'), out var value))
            {
                return value / 100m;
            }
        }
        return 1m;
    }

    // Xác định hệ số ngày đặc biệt dựa vào ngày
    private static decimal GetDayFactor(DateTime date, Dictionary<string, object> row)
    {
        var dateOnly = DateOnly.FromDateTime(date);
        
        // Kiểm tra ngày đặc biệt (ưu tiên cao nhất)
        if (row.ContainsKey("specialDay") && IsSpecialDay(dateOnly))
        {
            return ParsePercent(row["specialDay"]?.ToString() ?? "100%");
        }
        
        // Kiểm tra ngày nghỉ lễ
        if (row.ContainsKey("holiday") && IsHoliday(dateOnly))
        {
            return ParsePercent(row["holiday"]?.ToString() ?? "100%");
        }
        
        // Chủ nhật
        if (date.DayOfWeek == DayOfWeek.Sunday && row.ContainsKey("sunday"))
        {
            return ParsePercent(row["sunday"]?.ToString() ?? "100%");
        }
        
        // Thứ 7
        if (date.DayOfWeek == DayOfWeek.Saturday && row.ContainsKey("saturday"))
        {
            return ParsePercent(row["saturday"]?.ToString() ?? "100%");
        }
        
        return 1m;
    }

    private static bool IsHoliday(DateOnly date)
    {
        if (_context == null) return false;
        
        try
        {
            var holidayConfig = _context.SystemConfigs
                .FirstOrDefault(c => c.Key == "Holidays");
            
            if (holidayConfig == null || string.IsNullOrEmpty(holidayConfig.Value))
                return false;
            
            var holidays = JsonSerializer.Deserialize<List<HolidayDto>>(holidayConfig.Value);
            if (holidays == null || holidays.Count == 0)
                return false;
            
            return holidays.Any(h => 
                !h.IsSpecialDay && 
                date >= DateOnly.Parse(h.StartDate) && 
                date <= DateOnly.Parse(h.EndDate)
            );
        }
        catch
        {
            return false;
        }
    }

    private static bool IsSpecialDay(DateOnly date)
    {
        if (_context == null) return false;
        
        try
        {
            var holidayConfig = _context.SystemConfigs
                .FirstOrDefault(c => c.Key == "Holidays");
            
            if (holidayConfig == null || string.IsNullOrEmpty(holidayConfig.Value))
                return false;
            
            var holidays = JsonSerializer.Deserialize<List<HolidayDto>>(holidayConfig.Value);
            if (holidays == null || holidays.Count == 0)
                return false;
            
            return holidays.Any(h => 
                h.IsSpecialDay && 
                date >= DateOnly.Parse(h.StartDate) && 
                date <= DateOnly.Parse(h.EndDate)
            );
        }
        catch
        {
            return false;
        }
    }

    private class HolidayDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string StartDate { get; set; } = string.Empty;
        public string EndDate { get; set; } = string.Empty;
        public bool IsSpecialDay { get; set; }
        public string? Note { get; set; }
    }
}
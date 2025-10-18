using System.Text.Json;
using ApiApplication.Dtos;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Helpers;

public static class SalaryHelper
{
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
                        (
                            overlapAttendance.CheckOutTime.HasValue
                            && overlapAttendance.CheckOutTime.Value < schedule.Shift.EndTime
                        )
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
                    var factor = 1m;
                    // Chủ nhật
                    if (
                        schedule.Date.DayOfWeek == DayOfWeek.Sunday
                        && row.ContainsKey("sunday")
                        && row["sunday"] != null
                    )
                        factor = ParsePercent(row["sunday"]?.ToString() ?? "100%");
                    // Thứ 7
                    else if (
                        schedule.Date.DayOfWeek == DayOfWeek.Saturday
                        && row.ContainsKey("saturday")
                        && row["saturday"] != null
                    )
                        factor = ParsePercent(row["saturday"]?.ToString() ?? "100%");
                    // Ngày nghỉ lễ, đặc biệt: có thể bổ sung logic nhận diện ngày nghỉ lễ/specialDay ở đây

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
                    var factor = 1m;
                    // Chủ nhật
                    if (
                        schedule.Date.DayOfWeek == DayOfWeek.Sunday
                        && row.ContainsKey("sunday")
                        && row["sunday"] != null
                    )
                        factor = ParsePercent(row["sunday"]?.ToString() ?? "100%");
                    // Thứ 7
                    else if (
                        schedule.Date.DayOfWeek == DayOfWeek.Saturday
                        && row.ContainsKey("saturday")
                        && row["saturday"] != null
                    )
                        factor = ParsePercent(row["saturday"]?.ToString() ?? "100%");
                    // Ngày nghỉ lễ, đặc biệt: có thể bổ sung logic nhận diện ngày nghỉ lễ/specialDay ở đây

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

        // //deduct for late and absent (chưa triển khai, có thể bổ sung sau)
        return (int)totalSalary;
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

    // // Xác định hệ số ngày đặc biệt dựa vào ngày
    // private static decimal GetDayFactor(DateTime date, Dictionary<string, object> row)
    // {
    //     // Chủ nhật
    //     if (date.DayOfWeek == DayOfWeek.Sunday && row.ContainsKey("sunday"))
    //         return ParsePercent(row["sunday"].ToString());
    //     // Thứ 7
    //     if (date.DayOfWeek == DayOfWeek.Saturday && row.ContainsKey("saturday"))
    //         return ParsePercent(row["saturday"].ToString());
    //     // Ngày nghỉ lễ (cần bổ sung logic nhận diện ngày nghỉ lễ nếu có)
    //     if (row.ContainsKey("holiday"))
    //     {
    //         // Nếu có logic nhận diện ngày nghỉ lễ thì kiểm tra ở đây
    //         // Ví dụ: if (IsHoliday(date)) return ParsePercent(row["holiday"].ToString());
    //     }
    //     // Ngày đặc biệt (cần bổ sung logic nhận diện ngày đặc biệt nếu có)
    //     if (row.ContainsKey("specialDay"))
    //     {
    //         // Nếu có logic nhận diện ngày đặc biệt thì kiểm tra ở đây
    //         // Ví dụ: if (IsSpecialDay(date)) return ParsePercent(row["specialDay"].ToString());
    //     }
    //     return 1m;
    // }
}

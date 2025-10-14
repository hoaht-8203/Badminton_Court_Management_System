using System.Text.Json;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Helpers;
public static class SalaryHelper
{
    public static decimal CalculateSalary(Staff staff, List<AttendanceRecord> attendances)
    {
        // var totalSalary = 0m;
        // var salarySettings = JsonSerializer.Deserialize<Dictionary<string, object>>(staff.SalarySettings);
        // if (salarySettings == null)
        // {
        //     return 0;
        // }
        // if (salarySettings["salaryType"].ToString() == "fixed")
        // {
        //     //group attendances by date and count number of working days and half working days
        //     //8hours full day 4hours half day
        //     var groupedAttendances = attendances.GroupBy(a => a.Date);

        //     // check total hours of attendance for each day
        //     var workingDays = 0;
        //     var halfWorkingDays = 0;
        //     foreach (var group in groupedAttendances)
        //     {
        //         var totalHours = group.Sum(a => a.CheckOutTime.HasValue ? (a.CheckOutTime.Value - a.CheckInTime).TotalHours : 0);
        //         if (totalHours >= 8)
        //         {
        //             workingDays++;
        //         }
        //         else if (totalHours >= 4)
        //         {
        //             halfWorkingDays++;
        //         }
        //     }
        //     var dailyRate = Convert.ToDecimal(salarySettings["SalaryAmount"]) / 30;

        //     totalSalary = (workingDays * dailyRate) + (halfWorkingDays * dailyRate / 2);
        // }
        // else if (salarySettings["salaryType"].ToString() == "hourly")
        // {
        //     if (salarySettings["showAdvanced"].ToString() == "true" && salarySettings.ContainsKey("advancedRows"))
        //     {
        //         var advancedRowsJson = salarySettings["advancedRows"].ToString();
        //         if (!string.IsNullOrEmpty(advancedRowsJson))
        //         {
        //             var advancedRows = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(advancedRowsJson);
        //             foreach (var attendance in attendances)
        //             {
        //                 var shiftId = attendance.ShiftId.ToString();
        //                 var row = advancedRows.FirstOrDefault(r => r["shiftId"].ToString() == shiftId)
        //                           ?? advancedRows.FirstOrDefault(r => r["shiftId"].ToString() == "0");
        //                 if (row != null)
        //                 {
        //                     var amount = Convert.ToDecimal(row["amount"]);
        //                     var factor = GetDayFactor(attendance.Date.ToDateTime(TimeOnly.MinValue), row);
        //                     var hours = attendance.CheckOutTime.HasValue ? (attendance.CheckOutTime.Value - attendance.CheckInTime).TotalHours : 0;
        //                     totalSalary += amount * (decimal)hours * factor;
        //                 }
        //             }
        //         }
        //     }
        //     else
        //     {
        //         var hourlyRate = Convert.ToDecimal(salarySettings["SalaryAmount"]);
        //         var totalHours = attendances.Sum(a => a.CheckOutTime.HasValue ? (a.CheckOutTime.Value - a.CheckInTime).TotalHours : 0);
        //         totalSalary = (decimal)totalHours * hourlyRate;
        //     }
        // }
        // else if (salarySettings["salaryType"].ToString() == "shift")
        // {
        //     if (salarySettings["showAdvanced"].ToString() == "true" && salarySettings.ContainsKey("advancedRows"))
        //     {
        //         var advancedRowsJson = salarySettings["advancedRows"].ToString();
        //         if (!string.IsNullOrEmpty(advancedRowsJson))
        //         {
        //             var advancedRows = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(advancedRowsJson);
        //             foreach (var attendance in attendances)
        //             {
        //                 var shiftId = attendance.ShiftId.ToString();
        //                 var row = advancedRows.FirstOrDefault(r => r["shiftId"].ToString() == shiftId)
        //                           ?? advancedRows.FirstOrDefault(r => r["shiftId"].ToString() == "0");
        //                 if (row != null)
        //                 {
        //                     var amount = Convert.ToDecimal(row["amount"]);
        //                     var factor = GetDayFactor(attendance.Date.ToDateTime(TimeOnly.MinValue), row);
        //                     totalSalary += amount * factor;
        //                 }
        //             }
        //         }
        //     }
        //     else
        //     {
        //         var shiftRate = Convert.ToDecimal(salarySettings["SalaryAmount"]);
        //         var totalShifts = attendances.Count;
        //         totalSalary = totalShifts * shiftRate;
        //     }
        // }
        
        // //deduct for late and absent (chưa triển khai, có thể bổ sung sau)
        // foreach (var attendance in attendances)
        // {
        //     if (attendance.Status == AttendanceStatus.Late)
        //     {
        //         // Deduct for late
        //     }
        //     else if (attendance.Status == AttendanceStatus.Absent)
        //     {
        //         // Deduct for absent
        //     }
        // }
        // return totalSalary;
        return 0;
    }
    // private static decimal ParsePercent(string percent)
    // {
    //     if (percent.EndsWith("%"))
    //     {
    //         if (decimal.TryParse(percent.TrimEnd('%'), out var value))
    //         {
    //             return value / 100m;
    //         }
    //     }
    //     return 1m;
    // }

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
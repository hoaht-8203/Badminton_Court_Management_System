using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Helpers;

public static class AttendanceHelper
{
    public static string DetermineStatusByShift(TimeOnly? checkInTime, TimeOnly? checkOutTime, Entities.Shift shift)
    {
        var now = DateTime.Now;
        var shiftStart = shift.StartTime;
        var shiftEnd = shift.EndTime;

        if (checkInTime.HasValue && checkOutTime.HasValue)
        {
            if (checkInTime <= shiftStart && checkOutTime >= shiftEnd)
            {
                return AttendanceStatus.Attended; // Đúng giờ
            }
            else
            {
                return AttendanceStatus.Late; // Đi muộn hoặc về sớm
            }
        }
        if ((checkInTime.HasValue && !checkOutTime.HasValue) || (!checkInTime.HasValue && checkOutTime.HasValue))
        {
            return AttendanceStatus.Missing; // Chấm công thiếu
        }
        return AttendanceStatus.Absent; // Nghỉ làm
    }
}

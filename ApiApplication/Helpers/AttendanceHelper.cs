using System;
using ApiApplication.Dtos;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Helpers;

public static class AttendanceHelper
{
    public static string DetermineStatusOfShift(List<AttendanceRecord> attendanceRecords, ShiftResponse shift)
    {
        // Giả sử shift có StartTime, EndTime kiểu TimeSpan hoặc DateTime
        // AttendanceRecord có CheckInTime, CheckOutTime kiểu DateTime?
        var shiftStart = shift.StartTime;
        var shiftEnd = shift.EndTime;
        // Tìm bản ghi có thời gian giao với ca làm việc
        var relevantRecord = attendanceRecords
            .Where(a => a.CheckInTime <= shiftEnd && a.CheckOutTime >= shiftStart)
            .FirstOrDefault();

        if (relevantRecord == null)
        {
            var missingRecord = attendanceRecords
                .Where(a => a.CheckInTime <= shiftEnd && a.CheckOutTime == null)
                .FirstOrDefault();
            if (missingRecord != null)
            {
                return AttendanceStatus.Missing;
            }
            return AttendanceStatus.Absent;
        }

        if (relevantRecord.CheckInTime > shiftStart || (relevantRecord.CheckOutTime.HasValue && relevantRecord.CheckOutTime < shiftEnd))
        {
            return AttendanceStatus.Late;
        }
        

        return AttendanceStatus.Attended;
    }
}

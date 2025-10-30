using System;
using ApiApplication.Dtos;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Helpers;

public static class AttendanceHelper
{
    public static string DetermineStatusOfShift(
        List<AttendanceRecord> attendanceRecords,
        ShiftResponse shift
    )
    {
        // Normalize comparisons by converting TimeOnly -> DateTime using the attendance record's date.
        // This also properly handles overnight shifts (shift.EndTime <= shift.StartTime -> end is next day).

        foreach (var a in attendanceRecords)
        {
            // Build DateTime for record's checkin/checkout and shift start/end on that date
            var recordCheckIn = a.Date.ToDateTime(a.CheckInTime);
            DateTime? recordCheckOut = a.CheckOutTime.HasValue
                ? a.Date.ToDateTime(a.CheckOutTime.Value)
                : (DateTime?)null;

            var shiftStartDt = a.Date.ToDateTime(shift.StartTime);
            var shiftEndDt = a.Date.ToDateTime(shift.EndTime);

            // If shift wraps to next day (overnight), move shiftEnd to next day
            if (shiftEndDt <= shiftStartDt)
            {
                shiftEndDt = shiftEndDt.AddDays(1);
            }

            // If record checkout exists but is earlier than checkin (cross-midnight), move it to next day
            if (recordCheckOut.HasValue && recordCheckOut.Value < recordCheckIn)
            {
                recordCheckOut = recordCheckOut.Value.AddDays(1);
            }

            // Check if this attendance record overlaps the shift interval
            var overlaps = recordCheckIn <= shiftEndDt && (recordCheckOut == null || recordCheckOut >= shiftStartDt);
            if (overlaps)
            {
                // If there's no checkout, it's a missing checkout
                if (recordCheckOut == null)
                {
                    return AttendanceStatus.Missing;
                }

                // Late if checked in after shift start OR checked out before shift end (strict > or <)
                if (recordCheckIn > shiftStartDt || recordCheckOut.Value < shiftEndDt)
                {
                    return AttendanceStatus.Late;
                }

                return AttendanceStatus.Attended;
            }
        }

        // No overlapping records found -> absent
        return AttendanceStatus.Absent;
    }
}

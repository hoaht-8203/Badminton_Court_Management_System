using ApiApplication.Constants;
using ApiApplication.Dtos;
using ApiApplication.Entities.Shared;
using AutoMapper;
using Minio.DataModel.Result;

namespace ApiApplication.Helpers
{
    public static class ScheduleHelper
    {
        public static List<ScheduleResponse> StandardizeSchedule(
            List<Entities.Schedule> schedules,
            DateOnly startDate,
            DateOnly endDate,
            IMapper _mapper,
            List<Entities.AttendanceRecord>? attendanceRecords = null
        )
        {
            var result = new List<ScheduleResponse>();
            attendanceRecords ??= new List<Entities.AttendanceRecord>();

            foreach (var schedule in schedules)
            {
                if (schedule.IsFixedShift)
                {
                    var normalizedSchedules = new List<ScheduleResponse>();
                    for (var date = startDate; date <= endDate; date = date.AddDays(1))
                    {
                        if (!schedule.ByDay.Contains(DoWMapping.DayOfWeekToString[date.DayOfWeek]))
                            continue;

                        // Get attendance status for this date
                        var attendanceStatus = GetAttendanceStatus(
                            attendanceRecords,
                            schedule,
                            date,
                            _mapper
                        );

                        var scheduleResponse = new ScheduleResponse
                        {
                            Staff = _mapper.Map<StaffResponse>(schedule.Staff),
                            Shift = _mapper.Map<ShiftResponse>(schedule.Shift),
                            Date = date.ToDateTime(TimeOnly.MinValue),
                            DayOfWeek = date.DayOfWeek,
                            IsFixedShift = schedule.IsFixedShift,
                            AttendanceStatus = attendanceStatus,
                        };
                        normalizedSchedules.Add(scheduleResponse);
                    }
                    result.AddRange(normalizedSchedules);
                }
                else
                {
                    // Get attendance status for this date
                    var attendanceStatus = GetAttendanceStatus(
                        attendanceRecords,
                        schedule,
                        schedule.StartDate,
                        _mapper
                    );

                    var scheduleResponse = new ScheduleResponse
                    {
                        Staff = _mapper.Map<StaffResponse>(schedule.Staff),
                        Shift = _mapper.Map<ShiftResponse>(schedule.Shift),
                        Date = schedule.StartDate.ToDateTime(TimeOnly.MinValue),
                        DayOfWeek = schedule.StartDate.DayOfWeek,
                        IsFixedShift = schedule.IsFixedShift,
                        AttendanceStatus = attendanceStatus,
                    };
                    result.Add(scheduleResponse);
                }
                //remove duplicates
                result = result
                    .GroupBy(s => new
                    {
                        Staff = s.Staff.Id,
                        Shift = s.Shift.Id,
                        Date = s.Date,
                    })
                    .Select(g => g.First())
                    .ToList();
            }
            return result;
        }

        private static string GetAttendanceStatus(
            List<Entities.AttendanceRecord> attendanceRecords,
            Entities.Schedule schedule,
            DateOnly date,
            IMapper mapper
        )
        {
            // Filter attendance records for this staff and date
            var recordsForDate = attendanceRecords
                .Where(a => a.StaffId == schedule.StaffId && a.Date == date)
                .ToList();

            // If no attendance records exist
            if (recordsForDate.Count == 0)
            {
                // If date is in the past, mark as Absent
                if (date < DateOnly.FromDateTime(DateTime.Now))
                {
                    return AttendanceStatus.Absent;
                }
                // Future date - not yet
                return AttendanceStatus.NotYet;
            }

            // Use AttendanceHelper to determine status
            var shiftResponse = mapper.Map<ShiftResponse>(schedule.Shift);
            return AttendanceHelper.DetermineStatusOfShift(recordsForDate, shiftResponse);
        }
    }
}

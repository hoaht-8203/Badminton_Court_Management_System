using ApiApplication.Constants;
using ApiApplication.Dtos;
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
            IMapper _mapper
        )
        {
            var result = new List<ScheduleResponse>();
            foreach (var schedule in schedules)
            {
                if (schedule.IsFixedShift)
                {
                    var normalizedSchedules = new List<ScheduleResponse>();
                    for (var date = startDate; date <= endDate; date = date.AddDays(1))
                    {
                        if (!schedule.ByDay.Contains(DoWMapping.DayOfWeekToString[date.DayOfWeek]))
                            continue;

                        var scheduleResponse = new ScheduleResponse
                        {
                            Staff = _mapper.Map<StaffResponse>(schedule.Staff),
                            Shift = _mapper.Map<ShiftResponse>(schedule.Shift),
                            Date = date.ToDateTime(TimeOnly.MinValue),
                            DayOfWeek = date.DayOfWeek,
                        };
                        normalizedSchedules.Add(scheduleResponse);
                    }
                    result.AddRange(normalizedSchedules);
                }
                else
                {
                    var scheduleResponse = new ScheduleResponse
                    {
                        Staff = _mapper.Map<StaffResponse>(schedule.Staff),
                        Shift = _mapper.Map<ShiftResponse>(schedule.Shift),
                        Date = startDate.ToDateTime(TimeOnly.MinValue),
                        DayOfWeek = startDate.DayOfWeek,
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
    }
}

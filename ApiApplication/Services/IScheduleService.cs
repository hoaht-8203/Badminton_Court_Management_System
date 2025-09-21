using System;
using ApiApplication.Dtos;

namespace ApiApplication.Services;

public interface IScheduleService
{
    Task AssignShiftToStaffAsync(ScheduleRequest request);
    Task<List<Dtos.ScheduleResponse>> GetScheduleOfWeekAsync(DateOnly startDate, DateOnly endDate);
    Task RemoveStaffFromShiftAsync(ScheduleRequest request);
}

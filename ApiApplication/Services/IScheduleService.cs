using System;
using ApiApplication.Dtos;

namespace ApiApplication.Services;

public interface IScheduleService
{
    Task<bool> AssignShiftToStaffAsync(ScheduleRequest request);
    Task<List<ScheduleByShiftResponse>> GetScheduleOfWeekByShiftAsync(
        DateOnly startDate,
        DateOnly endDate
    );
    Task<List<ScheduleByStaffResponse>> GetScheduleOfWeekByStaffAsync(
        DateOnly startDate,
        DateOnly endDate
    );
    Task<bool> RemoveStaffFromShiftAsync(ScheduleRequest request);
}

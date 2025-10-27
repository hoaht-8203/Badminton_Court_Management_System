using System;
using ApiApplication.Dtos;

namespace ApiApplication.Services;

public interface IScheduleService
{
    Task<bool> AssignShiftToStaffAsync(ScheduleRequest request);
    Task<List<ScheduleByShiftResponse>> GetScheduleOfWeekByShiftAsync(
        WeeklyScheduleRequest request
    );
    Task<List<ScheduleByStaffResponse>> GetScheduleOfWeekByStaffAsync(
        WeeklyScheduleRequest request
    );
    Task<List<ScheduleResponse>> GetScheduleOfWeekByStaffIdAsync(
        ScheduleRequest request,
        int staffId
    );
    Task<bool> RemoveStaffFromShiftAsync(ScheduleRequest request);
}

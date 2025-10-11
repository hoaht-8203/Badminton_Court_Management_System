using System;
using ApiApplication.Dtos;

namespace ApiApplication.Services;

public interface IScheduleService
{
    Task<bool> AssignShiftToStaffAsync(ScheduleRequest request);
    Task<List<ScheduleByShiftResponse>> GetScheduleOfWeekByShiftAsync(ScheduleRequest request);
    Task<List<ScheduleByStaffResponse>> GetScheduleOfWeekByStaffAsync(ScheduleRequest request);
    Task<List<ScheduleResponse>> GetScheduleOfWeekByStaffIdAsync(
        ScheduleRequest request,
        int staffId
    );
    Task<bool> RemoveStaffFromShiftAsync(ScheduleRequest request);
}

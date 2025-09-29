using System;
using ApiApplication.Entities;

namespace ApiApplication.Dtos;

public class ScheduleByStaffResponse
{
    public StaffResponse Staff { get; set; } = new();
    public List<StaffShiftDto> Days { get; set; } = new();
}

public class StaffShiftDto
{
    public DateTime Date { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public List<ShiftResponse> Shifts { get; set; } = new();
}

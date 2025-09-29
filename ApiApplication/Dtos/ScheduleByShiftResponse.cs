using ApiApplication.Dtos;
using ApiApplication.Entities;

namespace ApiApplication.Dtos;

public class ScheduleByShiftResponse
{
    public ShiftResponse Shift { get; set; } = new();
    public List<ShiftAssignmentDto> Days { get; set; } = new();
}

public class ShiftAssignmentDto
{
    public DateTime Date { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public List<StaffResponse> Staffs { get; set; } = new();
}

using System;

namespace ApiApplication.Dtos
{
    public class ScheduleRequest
    {
    public int? StaffId { get; set; }
    public int ShiftId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string[] ByDay { get; set; } = Array.Empty<string>();
    public bool IsFixedShift { get; set; } = false;
    }
}
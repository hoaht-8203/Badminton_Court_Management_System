using System;

namespace ApiApplication.Dtos.Attendance;

public class AttendanceRequest
{
    public int? Id { get; set; } = null;
    public int StaffId { get; set; }
    public DateTime Date { get; set; }
    public TimeOnly? CheckInTime { get; set; }
    public TimeOnly? CheckOutTime { get; set; }
    public string? Notes { get; set; }
}

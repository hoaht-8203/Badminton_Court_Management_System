using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos.Attendance;

public class AttendanceResponse
{
    public int Id { get; set; }
    public int StaffId { get; set; }
    public StaffResponse Staff { get; set; }
    public int ShiftId { get; set; }
    public ShiftResponse Shift { get; set; }
    public DateTime Date { get; set; }
    public TimeOnly CheckInTime { get; set; }
    public TimeOnly? CheckOutTime { get; set; }
    public required string Status { get; set; } = AttendanceStatus.NotYet;
    public string? Notes { get; set; }
}

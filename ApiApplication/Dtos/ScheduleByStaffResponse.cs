using System;

namespace ApiApplication.Dtos;

public class ScheduleByStaffResponse
{
    public int Id { get; set; }
    public int? StaffId { get; set; }
    public int ShiftId { get; set; }
}

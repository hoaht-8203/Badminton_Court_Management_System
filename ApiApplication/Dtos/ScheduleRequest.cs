using System;

namespace ApiApplication.Dtos
{
    public class ScheduleRequest
    {
        public int? StaffId { get; set; }
        public int ShiftId { get; set; }
        public DateOnly StartDate { get; set; }
        public DateOnly? EndDate { get; set; }
        public string[] ByDay { get; set; } = Array.Empty<string>();
        public bool IsFixedShift { get; set; } = false;
    }
}
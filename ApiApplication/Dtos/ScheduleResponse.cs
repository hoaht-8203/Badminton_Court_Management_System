using System;
using ApiApplication.Entities;

namespace ApiApplication.Dtos
{
    public class ScheduleResponse
    {
        public int Id { get; set; }
        public StaffResponse Staff { get; set; } = new();
        public ShiftResponse Shift { get; set; } = new();
        public DateTime Date { get; set; }
        public DayOfWeek DayOfWeek { get; set; }
        public bool IsFixedShift { get; set; }
    }
}

using System;

namespace ApiApplication.Dtos
{
    public class ScheduleResponse
    {
        public int Id { get; set; }
        public int? StaffId { get; set; }
        public int ShiftId { get; set; }
        public DateOnly Date { get; set; }
        public int DayOfWeek { get; set; }
    }
}
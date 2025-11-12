using System;

namespace ApiApplication.Dtos
{
    public class WeeklyScheduleRequest
    {
        public List<int> StaffIds { get; set; } = new List<int>();
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }
}

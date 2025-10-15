using System;

namespace ApiApplication.Dtos
{
    public class WeeklyScheduleRequest
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }
}

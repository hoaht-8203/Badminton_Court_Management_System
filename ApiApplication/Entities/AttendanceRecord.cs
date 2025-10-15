using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities
{
    public class AttendanceRecord
    {
        public int Id { get; set; }
        public int StaffId { get; set; }
        public Staff? Staff { get; set; }
        public DateOnly Date { get; set; }
        public TimeOnly CheckInTime { get; set; }
        public TimeOnly? CheckOutTime { get; set; }
        public string? Notes { get; set; }
    }
}

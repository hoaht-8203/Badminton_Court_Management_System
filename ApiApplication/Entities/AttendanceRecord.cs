using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities
{
    public class AttendanceRecord
    { 
        public int Id { get; set; }
        public int StaffId { get; set; }
        public Staff Staff { get; set; }
        public int ShiftId { get; set; }
        public Shift Shift { get; set; }
        public DateOnly Date { get; set; }
        public TimeOnly CheckInTime { get; set; }
        public TimeOnly? CheckOutTime { get; set; }
        public required string Status { get; set; } = AttendanceStatus.NotYet;
        public string? Notes { get; set; }
    }
}

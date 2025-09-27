namespace ApiApplication.Entities
{
    public class CancelledShift
    {
        public int Id { get; set; }
        public int? StaffId { get; set; }
        public Staff? Staff { get; set; }
        public int ShiftId { get; set; }
        public Shift? Shift { get; set; }
        public DateOnly Date { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}

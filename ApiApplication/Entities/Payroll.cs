using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities
{
    public class Payroll : BaseEntity
    {
        public int Id { get; set; }
        public required string Name { get; set; } = "Bảng lương" + DateTime.Now.ToString("MM/yyyy");
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public string Status { get; set; } = PayrollStatus.Pending;
        public string? Note { get; set; }
        public decimal TotalNetSalary { get; set; } = 0;
        public decimal TotalPaidAmount { get; set; } = 0;
        public ICollection<PayrollItem> PayrollItems { get; set; } = new List<PayrollItem>();
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class UserMembership : BaseEntity, IAuditableEntity
{
    [Key]
    public int Id { get; set; }

    public int CustomerId { get; set; }

    [ForeignKey(nameof(CustomerId))]
    public Customer? Customer { get; set; }

    public int MembershipId { get; set; }

    [ForeignKey(nameof(MembershipId))]
    public Membership? Membership { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; }

    // Trạng thái thanh toán/đăng ký: PendingPayment | Paid | Cancelled
    public string Status { get; set; } = "PendingPayment";

    public List<Payment> Payments { get; set; } = [];
}

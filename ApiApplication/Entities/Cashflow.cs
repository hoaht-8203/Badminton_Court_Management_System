using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Cashflow : BaseEntity
{
    [Key]
    public int Id { get; set; }
    public DateTime Time { get; set; } = DateTime.UtcNow;

    //public int? BranchId { get; set; }
    public required bool IsPayment { get; set; }
    public required int CashflowTypeId { get; set; }
    public CashflowType CashflowType { get; set; } = null!;
    public string RelatedId { get; set; } = string.Empty;
    public string? PersonType { get; set; } = RelatedPeopleGroup.Other;
    public string? RelatedPerson { get; set; }
    public required decimal Value { get; set; }

    // public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = CashFlowStatus.Paid;

    [MaxLength(1000)]
    public string? Note { get; set; }

    [MaxLength(100)]
    public string? ReferenceNumber { get; set; }
    // public bool AccountInBusinessResults { get; set; } = true;
}

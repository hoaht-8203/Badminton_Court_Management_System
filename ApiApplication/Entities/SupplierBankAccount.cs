using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class SupplierBankAccount : BaseEntity
{
    [Key]
    public int Id { get; set; }

    public int SupplierId { get; set; }
    public virtual Supplier Supplier { get; set; } = null!;

    [MaxLength(50)]
    public required string AccountNumber { get; set; }

    [MaxLength(100)]
    public required string AccountName { get; set; }

    [MaxLength(120)]
    public required string BankName { get; set; }

    public bool IsDefault { get; set; }
}

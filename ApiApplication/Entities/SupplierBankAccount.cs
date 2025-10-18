using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class SupplierBankAccount : BaseEntity, IAuditableEntity
{
    [Key]
    public int Id { get; set; }

    public int SupplierId { get; set; }
    public virtual Supplier Supplier { get; set; } = null!;

    [MaxLength(50)]
    public string AccountNumber { get; set; } = string.Empty;

    [MaxLength(100)]
    public string AccountName { get; set; } = string.Empty;

    [MaxLength(120)]
    public string BankName { get; set; } = string.Empty;

    public bool IsDefault { get; set; }
}

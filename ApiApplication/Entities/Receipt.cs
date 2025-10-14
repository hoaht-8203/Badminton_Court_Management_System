using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;
using ApiApplication.Constants;

namespace ApiApplication.Entities;

public class Receipt : BaseEntity, IAuditableEntity
{
    [Key]
    public int Id { get; set; }

    [MaxLength(20)]
    public string Code { get; set; } = string.Empty;

    public DateTime ReceiptTime { get; set; } = DateTime.UtcNow;

    public int SupplierId { get; set; }
    public virtual Supplier Supplier { get; set; } = null!;

    public decimal Discount { get; set; }
    public decimal PaymentAmount { get; set; }
    [MaxLength(10)]
    public string PaymentMethod { get; set; } = "cash"; // cash | transfer

    // Optional transfer info snapshot
    [MaxLength(50)] public string? SupplierBankAccountNumber { get; set; }
    [MaxLength(100)] public string? SupplierBankAccountName { get; set; }
    [MaxLength(120)] public string? SupplierBankName { get; set; }

    public ReceiptStatus Status { get; set; } = ReceiptStatus.Draft;

    public virtual ICollection<ReceiptItem> Items { get; set; } = new List<ReceiptItem>();
}



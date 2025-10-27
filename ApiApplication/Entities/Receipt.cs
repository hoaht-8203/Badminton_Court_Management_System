using System.ComponentModel.DataAnnotations;
using ApiApplication.Constants;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Receipt : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [MaxLength(20)]
    public string? Code { get; set; }

    public DateTime ReceiptTime { get; set; } = DateTime.UtcNow;

    public int SupplierId { get; set; }
    public virtual Supplier Supplier { get; set; } = null!;

    public decimal Discount { get; set; }
    public decimal PaymentAmount { get; set; }

    [MaxLength(10)]
    public string PaymentMethod { get; set; } = "cash";

    public int? SupplierBankAccountId { get; set; }
    public virtual SupplierBankAccount? SupplierBankAccount { get; set; }

    public ReceiptStatus Status { get; set; } = ReceiptStatus.Draft;

    [MaxLength(500)]
    public string? Note { get; set; }

    public virtual ICollection<ReceiptItem> Items { get; set; } = new List<ReceiptItem>();
}

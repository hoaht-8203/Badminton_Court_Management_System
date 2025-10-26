using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Receipt;

public class CreateReceiptRequest
{
    [Required]
    public int SupplierId { get; set; }

    [Required]
    public DateTime ReceiptTime { get; set; }

    [Required]
    public string PaymentMethod { get; set; } = "cash"; // cash | transfer
    public decimal Discount { get; set; }
    public decimal PaymentAmount { get; set; }
    public int? SupplierBankAccountId { get; set; }
    public string? Note { get; set; }
    public bool Complete { get; set; }

    public List<CreateReceiptItem> Items { get; set; } = [];
}

namespace ApiApplication.Dtos.Receipt;

public class DetailReceiptResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public DateTime ReceiptTime { get; set; }
    public int SupplierId { get; set; }
    public string PaymentMethod { get; set; } = "cash";
    public decimal Discount { get; set; }
    public decimal PaymentAmount { get; set; }
    public string? SupplierBankAccountNumber { get; set; }
    public string? SupplierBankAccountName { get; set; }
    public string? SupplierBankName { get; set; }
    public int Status { get; set; }
    public List<DetailReceiptItem> Items { get; set; } = [];
}

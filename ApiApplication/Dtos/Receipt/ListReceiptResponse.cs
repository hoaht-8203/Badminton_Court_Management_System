namespace ApiApplication.Dtos.Receipt;

public class ListReceiptResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public DateTime ReceiptTime { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public decimal NeedPay { get; set; }
    public int Status { get; set; }
}

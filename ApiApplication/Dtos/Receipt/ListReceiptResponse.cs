namespace ApiApplication.Dtos.Receipt;

public class ListReceiptResponse
{
    public int Id { get; set; }
    public string? Code { get; set; }
    public DateTime ReceiptTime { get; set; }
    public string? SupplierName { get; set; }
    public decimal NeedPay { get; set; }
    public int Status { get; set; }
}

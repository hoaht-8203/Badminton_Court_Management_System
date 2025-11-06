namespace ApiApplication.Dtos.Voucher;

public class ValidateVoucherResponse
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal FinalAmount { get; set; } // Tổng tiền sau khi giảm giá
    public VoucherResponse? Voucher { get; set; }
}


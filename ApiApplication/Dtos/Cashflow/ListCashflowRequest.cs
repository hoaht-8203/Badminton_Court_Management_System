using ApiApplication.Enums;

namespace ApiApplication.Dtos.Cashflow;

public class ListCashflowRequest
{
    public bool? IsPayment { get; set; }
    public PaymentMethod? PaymentMethod { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public int? CashflowTypeId { get; set; }
    public string? Status { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

using System;

namespace ApiApplication.Dtos.Order;

public class ListOrderRequest
{
    public string? Status { get; set; }
    public string? PaymentMethod { get; set; }
    public int? CustomerId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

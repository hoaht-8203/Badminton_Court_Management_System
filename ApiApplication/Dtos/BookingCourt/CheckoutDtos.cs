namespace ApiApplication.Dtos.BookingCourt;

public class CheckoutItemInput
{
    public required int ProductId { get; set; }
    public required int Quantity { get; set; }
}

public class CheckoutEstimateRequest
{
    public required Guid BookingId { get; set; }
    public List<CheckoutItemInput> Items { get; set; } = [];
}

public class CheckoutEstimateResponse
{
    public required Guid BookingId { get; set; }
    public int OverdueMinutes { get; set; }
    public decimal SurchargeAmount { get; set; }
    public decimal ItemsSubtotal { get; set; }
    public decimal CourtRemaining { get; set; }
    public decimal FinalPayable { get; set; }
}

public class AddOrderItemRequest
{
    public required Guid BookingId { get; set; }
    public required int ProductId { get; set; }
    public required int Quantity { get; set; }
}

public class BookingOrderItemResponse
{
    public required int ProductId { get; set; }
    public required string ProductName { get; set; }
    public string? Image { get; set; }
    public required decimal UnitPrice { get; set; }
    public required int Quantity { get; set; }
}

public class UpdateOrderItemRequest
{
    public required Guid BookingId { get; set; }
    public required int ProductId { get; set; }
    public required int Quantity { get; set; } // absolute desired quantity; <=0 will remove
}

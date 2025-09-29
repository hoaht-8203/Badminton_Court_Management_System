using System;

namespace ApiApplication.Dtos.Invoice;

public class CreateInvoiceRequest
{
    public required Guid BookingId { get; set; }
}

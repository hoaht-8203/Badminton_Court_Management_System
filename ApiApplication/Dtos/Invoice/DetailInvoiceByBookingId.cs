using System;

namespace ApiApplication.Dtos.Invoice;

public class DetailInvoiceByBookingIdRequest
{
    public required Guid BookingId { get; set; }
}

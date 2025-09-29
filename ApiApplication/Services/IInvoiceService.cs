using ApiApplication.Dtos.Invoice;

namespace ApiApplication.Services;

public interface IInvoiceService
{
	Task<DetailInvoiceResponse> CreateInvocieAsync(Guid bookingId);
	Task<DetailInvoiceResponse?> GetByBookingIdAsync(Guid bookingId);
	Task<DetailInvoiceResponse?> GetByIdAsync(Guid invoiceId);
}



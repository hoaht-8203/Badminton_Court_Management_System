using ApiApplication.Dtos.BookingCourt;
using ApiApplication.Dtos.Invoice;

namespace ApiApplication.Services;

public interface IInvoiceService
{
	Task<DetailInvoiceResponse> CreateInvocieAsync(CreateInvoiceRequest request);
	Task<DetailInvoiceResponse?> DetailByBookingIdAsync(DetailInvoiceByBookingIdRequest request);
	Task<DetailInvoiceResponse?> DetailInvoiceByIdAsync(DetailInvoiceRequest request);
}



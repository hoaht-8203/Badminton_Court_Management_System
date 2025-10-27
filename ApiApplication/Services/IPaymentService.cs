using ApiApplication.Dtos.Payment;

namespace ApiApplication.Services;

public interface IPaymentService
{
    Task<DetailPaymentResponse> CreatePaymentAsync(CreatePaymentRequest request);
    Task<DetailPaymentResponse> CreatePaymentForOrderAsync(CreatePaymentForOrderRequest request);
    Task<DetailPaymentResponse?> DetailByBookingIdAsync(DetailPaymentByBookingIdRequest request);
    Task<DetailPaymentResponse?> DetailPaymentByIdAsync(DetailPaymentRequest request);
}

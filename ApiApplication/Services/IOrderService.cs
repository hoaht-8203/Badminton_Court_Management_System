using ApiApplication.Dtos.Order;

namespace ApiApplication.Services;

public interface IOrderService
{
    Task<CheckoutResponse> CheckoutAsync(CheckoutRequest request);
    Task<OrderResponse> GetOrderByIdAsync(Guid orderId);
    Task<List<OrderResponse>> GetOrdersByBookingIdAsync(Guid bookingId);
    Task<bool> ConfirmPaymentAsync(Guid orderId);
}

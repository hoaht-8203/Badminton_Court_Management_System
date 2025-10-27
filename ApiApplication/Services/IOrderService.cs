using ApiApplication.Dtos.Order;

namespace ApiApplication.Services;

public interface IOrderService
{
    Task<CheckoutResponse> CheckoutAsync(CheckoutBookingRequest request);
    Task<CheckoutResponse> GetCheckoutInfoAsync(Guid orderId);
    Task<OrderResponse> GetOrderByIdAsync(Guid orderId);
    Task<List<OrderResponse>> GetOrdersByBookingIdAsync(Guid bookingId);
    Task<List<OrderResponse>> GetPendingPaymentOrdersAsync(
        string? status = null,
        string? paymentMethod = null
    );
    Task<List<ListOrderResponse>> GetOrdersAsync(ListOrderRequest request);
    Task<bool> ExtendPaymentTimeAsync(Guid orderId);
}

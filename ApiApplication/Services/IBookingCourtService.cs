using ApiApplication.Dtos.BookingCourt;

namespace ApiApplication.Services;

public interface IBookingCourtService
{
    Task<DetailBookingCourtResponse> CreateBookingCourtAsync(CreateBookingCourtRequest request);
    Task<List<ListBookingCourtResponse>> ListBookingCourtsAsync(ListBookingCourtRequest request);
    Task<DetailBookingCourtResponse> DetailBookingCourtAsync(DetailBookingCourtRequest request);
    Task<bool> CancelBookingCourtAsync(CancelBookingCourtRequest request);
    Task<bool> CheckInAsync(CheckInBookingCourtRequest request);
    Task<bool> CheckOutAsync(CheckOutBookingCourtRequest request);
    Task<bool> MarkNoShowAsync(NoShowBookingCourtRequest request);

    // Cashier flow
    Task<CheckoutEstimateResponse> EstimateCheckoutAsync(CheckoutEstimateRequest request);
    Task<bool> AddOrderItemAsync(AddOrderItemRequest request);
    Task<List<BookingOrderItemResponse>> ListOrderItemsAsync(Guid bookingId);
    Task<bool> UpdateOrderItemAsync(UpdateOrderItemRequest request);
}

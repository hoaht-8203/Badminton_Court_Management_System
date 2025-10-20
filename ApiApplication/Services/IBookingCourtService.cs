using ApiApplication.Dtos.BookingCourt;

namespace ApiApplication.Services;

public interface IBookingCourtService
{
    Task<DetailBookingCourtResponse> CreateBookingCourtAsync(CreateBookingCourtRequest request);
    Task<List<ListBookingCourtResponse>> ListBookingCourtsAsync(ListBookingCourtRequest request);
    Task<List<ListBookingCourtOccurrenceResponse>> ListBookingCourtOccurrencesAsync(
        ListBookingCourtOccurrenceRequest request
    );
    Task<DetailBookingCourtResponse> DetailBookingCourtAsync(DetailBookingCourtRequest request);
    Task<DetailBookingCourtOccurrenceResponse> DetailBookingCourtOccurrenceAsync(
        DetailBookingCourtOccurrenceRequest request
    );
    Task<bool> CancelBookingCourtAsync(CancelBookingCourtRequest request);

    // Occurrence-level operations
    Task<bool> CheckInOccurrenceAsync(CheckInBookingCourtRequest request);
    Task<bool> CheckOutOccurrenceAsync(CheckOutBookingCourtRequest request);
    Task<bool> MarkOccurrenceNoShowAsync(NoShowBookingCourtRequest request);

    // Cashier flow
    Task<CheckoutEstimateResponse> EstimateCheckoutAsync(CheckoutEstimateRequest request);
    Task<bool> AddOrderItemAsync(AddOrderItemRequest request);
    Task<List<BookingOrderItemResponse>> ListOrderItemsAsync(Guid occurrenceId);
    Task<bool> UpdateOrderItemAsync(UpdateOrderItemRequest request);
}

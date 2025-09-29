using ApiApplication.Dtos.BookingCourt;

namespace ApiApplication.Services;

public interface IBookingCourtService
{
	Task<DetailBookingCourtResponse> CreateBookingCourtAsync(CreateBookingCourtRequest request);
	Task<List<ListBookingCourtResponse>> ListBookingCourtsAsync(ListBookingCourtRequest request);
}



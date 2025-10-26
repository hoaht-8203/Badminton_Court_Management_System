using ApiApplication.Dtos.Service;

namespace ApiApplication.Services;

public interface IServiceService
{
    Task<List<ListServiceResponse>> ListServiceAsync(ListServiceRequest request);
    Task<DetailServiceResponse> DetailServiceAsync(DetailServiceRequest request);
    Task<DetailServiceResponse> CreateServiceAsync(CreateServiceRequest request);
    Task<DetailServiceResponse> UpdateServiceAsync(UpdateServiceRequest request);
    Task<bool> DeleteServiceAsync(DeleteServiceRequest request);
    Task<DetailServiceResponse> ChangeServiceStatusAsync(ChangeServiceStatusRequest request);

    // BookingService methods
    Task<BookingServiceDto> AddBookingServiceAsync(AddBookingServiceRequest request);
    Task<bool> RemoveBookingServiceAsync(RemoveBookingServiceRequest request);
    Task<List<BookingServiceDto>> GetBookingServicesAsync(Guid bookingCourtOccurrenceId);
    Task<BookingServiceDto> EndServiceAsync(EndServiceRequest request);
}

using ApiApplication.Dtos.Court;
using ApiApplication.Dtos.Customer;

namespace ApiApplication.Services;

public interface ICourtService
{
    Task<List<ListCourtResponse>> ListCourtsAsync(ListCourtRequest request);

    Task<DetailCourtResponse> DetailCourtAsync(DetailCourtRequest request);

    Task<DetailCourtResponse> CreateCourtAsync(CreateCourtRequest request);

    Task<DetailCourtResponse> UpdateCourtAsync(UpdateCourtRequest request);

    Task<bool> DeleteCourtAsync(DeleteCourtRequest request);

    Task<DetailCourtResponse> ChangeCourtStatusAsync(ChangeCourtStatusRequest request);
}

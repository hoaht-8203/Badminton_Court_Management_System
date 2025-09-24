using ApiApplication.Dtos.CourtArea;

namespace ApiApplication.Services;

public interface ICourtAreaService
{
    Task<List<ListCourtAreaResponse>> ListCourtAreasAsync();
    Task<DetailCourtAreaResponse> DetailCourtAreaAsync(DetailCourtAreaRequest request);
    Task<DetailCourtAreaResponse> CreateCoutAreaAsync(CreateCourtAreaRequest request);
    Task<DetailCourtAreaResponse> UpdateCourtAreaAsync(UpdateCourtAreaRequest request);
    Task DeleteCourtAreaAsync(DeletCourtAreaRequest request);
}

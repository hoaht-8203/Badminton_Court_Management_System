using ApiApplication.Dtos.Court;
using ApiApplication.Dtos.PriceUnit;

namespace ApiApplication.Services;

public interface IPriceUnitService
{
    Task<List<ListPriceUnitResponse>> ListPriceUnitsAsync();
    Task<DetailPriceUnitResponse> DetailPriceUnitAsync(DetailPriceUnitRequest request);
    Task<DetailPriceUnitResponse> CreatePriceUnitAsync(CreatePriceUnitRequest request);
    Task<DetailPriceUnitResponse> UpdatePriceUnitAsync(UpdatePriceUnitRequest request);
    Task DeletePriceUnitAsync(DeletePriceUnitRequest request);
}

using ApiApplication.Dtos.Slider;

namespace ApiApplication.Services;

public interface ISliderService
{
    Task<List<ListSliderResponse>> ListSlidersAsync();
    Task<DetailSliderResponse> DetailSliderAsync(DetailSliderRequest request);
    Task<DetailSliderResponse> CreateSliderAsync(CreateSliderRequest request);
    Task<DetailSliderResponse> UpdateSliderAsync(UpdateSliderRequest request);
    Task DeleteSliderAsync(DeleteSliderRequest request);
}

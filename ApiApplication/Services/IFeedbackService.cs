using ApiApplication.Dtos.Feedback;

namespace ApiApplication.Services;

public interface IFeedbackService
{
    Task<DetailFeedbackResponse> CreateFeedBackAsync(CreateFeedbackRequest request);
    Task<DetailFeedbackResponse> DetailFeedBackAsync(DetailFeedbackRequest request);
    Task<DetailFeedbackResponse> UpdateFeedBackAsync(UpdateFeedbackRequest request);
    Task<bool> DeleteFeedBackAsync(DeleteFeedbackRequest request);
    Task<List<ListFeedbackResponse>> ListFeedBackAsync(ListFeedbackRequest request);
    Task<List<ListFeedbackResponse>> ListFeedBackByBookingOccurrenceAsync(ListFeedbackByBookingRequest request);
    Task<List<ListFeedbackResponse>> ListFeedBackByCustomerAsync(ListFeedbackByCustomerRequest request);
}



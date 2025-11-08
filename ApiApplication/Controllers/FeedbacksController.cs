using ApiApplication.Dtos;
using ApiApplication.Dtos.Feedback;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FeedbacksController(IFeedbackService feedbackService) : ControllerBase
{
    private readonly IFeedbackService _feedbackService = feedbackService;

    [HttpPost("create")]
    public async Task<ActionResult<ApiResponse<DetailFeedbackResponse>>> Create(
        [FromBody] CreateFeedbackRequest request
    )
    {
        var result = await _feedbackService.CreateFeedBackAsync(request);
        return Ok(
            ApiResponse<DetailFeedbackResponse>.SuccessResponse(result, "Tạo feedback thành công")
        );
    }

    [HttpGet("detail")]
    public async Task<ActionResult<ApiResponse<DetailFeedbackResponse>>> Detail(
        [FromQuery] DetailFeedbackRequest request
    )
    {
        var result = await _feedbackService.DetailFeedBackAsync(request);
        return Ok(
            ApiResponse<DetailFeedbackResponse>.SuccessResponse(
                result,
                "Lấy chi tiết feedback thành công"
            )
        );
    }

    [HttpPut("update")]
    public async Task<ActionResult<ApiResponse<DetailFeedbackResponse>>> Update(
        [FromBody] UpdateFeedbackRequest request
    )
    {
        var result = await _feedbackService.UpdateFeedBackAsync(request);
        return Ok(
            ApiResponse<DetailFeedbackResponse>.SuccessResponse(
                result,
                "Cập nhật feedback thành công"
            )
        );
    }

    [HttpDelete("delete")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(
        [FromQuery] DeleteFeedbackRequest request
    )
    {
        var result = await _feedbackService.DeleteFeedBackAsync(request);
        return Ok(ApiResponse<bool>.SuccessResponse(result, "Xóa feedback thành công"));
    }

    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<List<ListFeedbackResponse>>>> List(
        [FromQuery] ListFeedbackRequest request
    )
    {
        var result = await _feedbackService.ListFeedBackAsync(request);
        return Ok(
            ApiResponse<List<ListFeedbackResponse>>.SuccessResponse(
                result,
                "Lấy danh sách feedback thành công"
            )
        );
    }

    [HttpGet("list/{BookingCourtOccurrenceId:guid}")]
    public async Task<ActionResult<ApiResponse<List<ListFeedbackResponse>>>> ListByBooking(
        [FromRoute] ListFeedbackByBookingRequest request
    )
    {
        var result = await _feedbackService.ListFeedBackByBookingOccurrenceAsync(request);
        return Ok(
            ApiResponse<List<ListFeedbackResponse>>.SuccessResponse(
                result,
                "Lấy danh sách feedback theo lịch đặt thành công"
            )
        );
    }

    [HttpGet("list/{CustomerId:int}")]
    public async Task<ActionResult<ApiResponse<List<ListFeedbackResponse>>>> ListByCustomer(
        [FromRoute] ListFeedbackByCustomerRequest request
    )
    {
        var result = await _feedbackService.ListFeedBackByCustomerAsync(request);
        return Ok(
            ApiResponse<List<ListFeedbackResponse>>.SuccessResponse(
                result,
                "Lấy danh sách feedback theo khách hàng thành công"
            )
        );
    }
}

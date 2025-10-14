using ApiApplication.Dtos;
using ApiApplication.Dtos.Service;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ServicesController(IServiceService serviceService) : ControllerBase
{
    private readonly IServiceService _serviceService = serviceService;

    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<List<ListServiceResponse>>>> List(
        [FromQuery] ListServiceRequest request
    )
    {
        var result = await _serviceService.ListServiceAsync(request);
        return Ok(
            ApiResponse<List<ListServiceResponse>>.SuccessResponse(
                result,
                "Get service list successfully"
            )
        );
    }

    [HttpGet("detail")]
    public async Task<ActionResult<ApiResponse<DetailServiceResponse>>> Detail(
        [FromQuery] DetailServiceRequest request
    )
    {
        var result = await _serviceService.DetailServiceAsync(request);
        return Ok(
            ApiResponse<DetailServiceResponse>.SuccessResponse(
                result,
                "Get service information successfully"
            )
        );
    }

    [HttpPost("create")]
    public async Task<ActionResult<ApiResponse<DetailServiceResponse>>> Create(
        [FromBody] CreateServiceRequest request
    )
    {
        var result = await _serviceService.CreateServiceAsync(request);
        return Ok(
            ApiResponse<DetailServiceResponse>.SuccessResponse(
                result,
                "Create service successfully"
            )
        );
    }

    [HttpPut("update")]
    public async Task<ActionResult<ApiResponse<DetailServiceResponse>>> Update(
        [FromBody] UpdateServiceRequest request
    )
    {
        var result = await _serviceService.UpdateServiceAsync(request);
        return Ok(
            ApiResponse<DetailServiceResponse>.SuccessResponse(result, "Service update successful")
        );
    }

    [HttpDelete("delete")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(
        [FromBody] DeleteServiceRequest request
    )
    {
        var result = await _serviceService.DeleteServiceAsync(request);
        return Ok(ApiResponse<bool>.SuccessResponse(result, "Service deleted successfully"));
    }

    [HttpPut("change-status")]
    public async Task<ActionResult<ApiResponse<DetailServiceResponse>>> ChangeStatus(
        [FromBody] ChangeServiceStatusRequest request
    )
    {
        var result = await _serviceService.ChangeServiceStatusAsync(request);
        return Ok(
            ApiResponse<DetailServiceResponse>.SuccessResponse(
                result,
                "Change service status successfully"
            )
        );
    }

    [HttpPost("booking/add-service")]
    public async Task<ActionResult<ApiResponse<BookingServiceDto>>> AddBookingService(
        [FromBody] AddBookingServiceRequest request
    )
    {
        var result = await _serviceService.AddBookingServiceAsync(request);
        return Ok(
            ApiResponse<BookingServiceDto>.SuccessResponse(
                result,
                "Add service to booking successfully"
            )
        );
    }

    [HttpDelete("booking/remove-service")]
    public async Task<ActionResult<ApiResponse<bool>>> RemoveBookingService(
        [FromBody] RemoveBookingServiceRequest request
    )
    {
        var result = await _serviceService.RemoveBookingServiceAsync(request);
        return Ok(
            ApiResponse<bool>.SuccessResponse(result, "Remove service from booking successfully")
        );
    }

    [HttpGet("booking/{bookingId}/services")]
    public async Task<ActionResult<ApiResponse<List<BookingServiceDto>>>> GetBookingServices(
        Guid bookingId
    )
    {
        var result = await _serviceService.GetBookingServicesAsync(bookingId);
        return Ok(
            ApiResponse<List<BookingServiceDto>>.SuccessResponse(
                result,
                "Get booking services successfully"
            )
        );
    }
}

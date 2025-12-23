using ApiApplication.Authorization;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Service;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Policy = PolicyConstants.ManagementOnly)]
public class ServicesController(IServiceService serviceService) : ControllerBase
{
    private readonly IServiceService _serviceService = serviceService;

    /// <summary>
    /// List services - Accessible by customers to view available services
    /// </summary>
    [AllowAnonymous]
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

    /// <summary>
    /// Get service details - Accessible by customers to view service information
    /// </summary>
    [AllowAnonymous]
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

    /// <summary>
    /// Add service to booking occurrence - Staff access for cashier operations
    /// </summary>
    [Authorize(Policy = PolicyConstants.StaffAccess)]
    [HttpPost("booking-occurrence/add-service")]
    public async Task<ActionResult<ApiResponse<BookingServiceDto>>> AddBookingService(
        [FromBody] AddBookingServiceRequest request
    )
    {
        var result = await _serviceService.AddBookingServiceAsync(request);
        return Ok(
            ApiResponse<BookingServiceDto>.SuccessResponse(
                result,
                "Add service to booking occurrence successfully"
            )
        );
    }

    /// <summary>
    /// Remove service from booking occurrence - Staff access
    /// </summary>
    [Authorize(Policy = PolicyConstants.StaffAccess)]
    [HttpDelete("booking-occurrence/remove-service")]
    public async Task<ActionResult<ApiResponse<bool>>> RemoveBookingService(
        [FromBody] RemoveBookingServiceRequest request
    )
    {
        var result = await _serviceService.RemoveBookingServiceAsync(request);
        return Ok(
            ApiResponse<bool>.SuccessResponse(
                result,
                "Remove service from booking occurrence successfully"
            )
        );
    }

    /// <summary>
    /// Get booking services - Staff access to view services in a booking
    /// </summary>
    [Authorize(Policy = PolicyConstants.StaffAccess)]
    [HttpGet("booking-occurrence/{bookingCourtOccurrenceId}/services")]
    public async Task<ActionResult<ApiResponse<List<BookingServiceDto>>>> GetBookingServices(
        Guid bookingCourtOccurrenceId
    )
    {
        var result = await _serviceService.GetBookingServicesAsync(bookingCourtOccurrenceId);
        return Ok(
            ApiResponse<List<BookingServiceDto>>.SuccessResponse(
                result,
                "Get booking services successfully"
            )
        );
    }

    /// <summary>
    /// End service - Staff access to stop service and calculate billing
    /// </summary>
    [Authorize(Policy = PolicyConstants.StaffAccess)]
    [HttpPut("booking-occurrence/end-service")]
    public async Task<ActionResult<ApiResponse<BookingServiceDto>>> EndService(
        [FromBody] EndServiceRequest request
    )
    {
        var result = await _serviceService.EndServiceAsync(request);
        return Ok(
            ApiResponse<BookingServiceDto>.SuccessResponse(result, "End service successfully")
        );
    }
}

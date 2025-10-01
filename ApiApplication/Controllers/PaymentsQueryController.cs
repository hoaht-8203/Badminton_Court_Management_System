using ApiApplication.Dtos;
using ApiApplication.Dtos.Payment;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class PaymentsController(IPaymentService paymentService) : ControllerBase
{
    private readonly IPaymentService _paymentService = paymentService;

    [HttpGet("detail-payment-by-booking-id")]
    public async Task<ActionResult<ApiResponse<DetailPaymentResponse?>>> GetByBooking(
        [FromQuery] DetailPaymentByBookingIdRequest request
    )
    {
        var dto = await _paymentService.DetailByBookingIdAsync(request);
        return Ok(
            ApiResponse<DetailPaymentResponse?>.SuccessResponse(dto, "Lấy payment thành công")
        );
    }

    [HttpGet("detail-payment-by-id")]
    public async Task<ActionResult<ApiResponse<DetailPaymentResponse?>>> Detail(
        [FromQuery] DetailPaymentRequest request
    )
    {
        var dto = await _paymentService.DetailPaymentByIdAsync(request);
        return Ok(
            ApiResponse<DetailPaymentResponse?>.SuccessResponse(dto, "Lấy payment thành công")
        );
    }
}

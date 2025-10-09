using ApiApplication.Dtos;
using ApiApplication.Dtos.Payment;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class PaymentsController(IPaymentService paymentService, IConfiguration configuration)
    : ControllerBase
{
    private readonly IPaymentService _paymentService = paymentService;
    private readonly IConfiguration _configuration = configuration;

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

    [HttpGet("qr-by-booking-id")]
    public async Task<ActionResult<ApiResponse<QrPaymentResponse?>>> GetQrByBooking(
        [FromQuery] DetailPaymentByBookingIdRequest request
    )
    {
        var payment = await _paymentService.DetailByBookingIdAsync(request);
        if (payment == null)
        {
            return Ok(ApiResponse<QrPaymentResponse?>.SuccessResponse(null, "Không có payment"));
        }

        var acc = Environment.GetEnvironmentVariable("SEPAY_ACC") ?? "VQRQAEMLF5363";
        var bank = Environment.GetEnvironmentVariable("SEPAY_BANK") ?? "MBBank";
        var amount = ((long)Math.Round(payment.Amount, 0)).ToString();
        var des = Uri.EscapeDataString(payment.Id);
        var qrUrl = $"https://qr.sepay.vn/img?acc={acc}&bank={bank}&amount={amount}&des={des}";
        var holdMins = _configuration.GetValue<int?>("Booking:HoldMinutes") ?? 5;

        return Ok(
            ApiResponse<QrPaymentResponse?>.SuccessResponse(
                new QrPaymentResponse
                {
                    PaymentId = payment.Id,
                    QrUrl = qrUrl,
                    Amount = payment.Amount,
                    ExpiresAtUtc = payment.PaymentCreatedAt.AddMinutes(holdMins),
                    HoldMinutes = holdMins,
                },
                "Lấy QR thành công"
            )
        );
    }
}

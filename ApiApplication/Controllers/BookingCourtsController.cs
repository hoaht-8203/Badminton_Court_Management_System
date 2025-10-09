using ApiApplication.Dtos;
using ApiApplication.Dtos.BookingCourt;
using ApiApplication.Extensions;
using ApiApplication.Services;
using ApiApplication.Services.Impl;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class BookingCourtsController(
    IBookingCourtService service,
    IPaymentService paymentService,
    IEmailService emailService,
    ILogger<BookingCourtsController> logger
) : ControllerBase
{
    private readonly IBookingCourtService _service = service;
    private readonly IPaymentService _paymentService = paymentService;
    private readonly IEmailService _emailService = emailService;
    private readonly ILogger<BookingCourtsController> _logger = logger;

    [HttpPost("create")]
    public async Task<ActionResult<ApiResponse<DetailBookingCourtResponse>>> Create(
        [FromBody] CreateBookingCourtRequest request
    )
    {
        var result = await _service.CreateBookingCourtAsync(request);

        // Lấy thông tin payment để gửi email thanh toán
        var payment = await _paymentService.DetailByBookingIdAsync(
            new Dtos.Payment.DetailPaymentByBookingIdRequest { BookingId = result.Id }
        );
        if (payment != null && !string.IsNullOrWhiteSpace(payment.CustomerEmail))
        {
            var acc = Environment.GetEnvironmentVariable("SEPAY_ACC") ?? "VQRQAEMLF5363";
            var bank = Environment.GetEnvironmentVariable("SEPAY_BANK") ?? "MBBank";
            var amount = ((long)Math.Round(payment.Amount, 0)).ToString();
            var des = Uri.EscapeDataString(payment.Id);
            var qrUrl = $"https://qr.sepay.vn/img?acc={acc}&bank={bank}&amount={amount}&des={des}";

            _emailService.SendEmailFireAndForget(
                () =>
                    _emailService.SendEmailAsync(
                        new Dtos.Email.EmailRequest
                        {
                            To = payment.CustomerEmail!,
                            ToName = payment.CustomerName,
                            Subject = "Thanh toán đặt sân",
                            Body =
                                $"Xin chào {payment.CustomerName},\n\nVui lòng thanh toán phiếu thanh toán {payment.Id} số tiền {payment.Amount:N0} VND qua QR: {qrUrl}\n\nTrân trọng.",
                            IsHtml = false,
                        }
                    ),
                _logger,
                payment.Id
            );
        }

        return Ok(
            ApiResponse<DetailBookingCourtResponse>.SuccessResponse(result, "Đặt sân thành công")
        );
    }

    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<List<ListBookingCourtResponse>>>> List(
        [FromQuery] ListBookingCourtRequest request
    )
    {
        var result = await _service.ListBookingCourtsAsync(request);
        return Ok(
            ApiResponse<List<ListBookingCourtResponse>>.SuccessResponse(
                result,
                "Lấy danh sách booking thành công"
            )
        );
    }

    [HttpGet("detail")]
    public async Task<ActionResult<ApiResponse<DetailBookingCourtResponse>>> Detail(
        [FromQuery] DetailBookingCourtRequest request
    )
    {
        var result = await _service.DetailBookingCourtAsync(request);
        return Ok(
            ApiResponse<DetailBookingCourtResponse>.SuccessResponse(
                result,
                "Lấy chi tiết booking thành công"
            )
        );
    }
}

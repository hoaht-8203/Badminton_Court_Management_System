using System.Collections.Generic;
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
    ILogger<BookingCourtsController> logger,
    IConfiguration configuration
) : ControllerBase
{
    private readonly IBookingCourtService _service = service;
    private readonly IPaymentService _paymentService = paymentService;
    private readonly IEmailService _emailService = emailService;
    private readonly ILogger<BookingCourtsController> _logger = logger;
    private readonly IConfiguration _configuration = configuration;

    [HttpPost("create")]
    public async Task<ActionResult<ApiResponse<DetailBookingCourtResponse>>> Create(
        [FromBody] CreateBookingCourtRequest request
    )
    {
        var result = await _service.CreateBookingCourtAsync(request);

        // Gửi email theo phương thức thanh toán
        var payment = await _paymentService.DetailByBookingIdAsync(
            new Dtos.Payment.DetailPaymentByBookingIdRequest { BookingId = result.Id }
        );
        if (payment != null && !string.IsNullOrWhiteSpace(payment.CustomerEmail))
        {
            // Nếu thanh toán bằng tiền mặt (đã Paid ngay trong PaymentService) => gửi email xác nhận booking
            if (
                string.Equals(
                    payment.Status,
                    Entities.Shared.PaymentStatus.Paid,
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                _emailService.SendEmailFireAndForget(
                    () =>
                        _emailService.SendBookingConfirmationEmailAsync(
                            new Dtos.Email.SendBookingConfirmationEmailAsyncRequest
                            {
                                To = payment.CustomerEmail!,
                                ToName = payment.CustomerName,
                                CustomerName = payment.CustomerName,
                                CourtName = payment.CourtName,
                                StartDate = result.StartDate.ToString(),
                                StartTime = result.StartTime.ToString(),
                                EndTime = result.EndTime.ToString(),
                                PaidAmount = payment.Amount.ToString("N0"),
                            }
                        ),
                    _logger,
                    payment.Id
                );
            }
            else
            {
                // Chuyển khoản => gửi email yêu cầu thanh toán + QR, kèm đếm ngược phút giữ chỗ
                var acc = Environment.GetEnvironmentVariable("SEPAY_ACC") ?? "VQRQAEMLF5363";
                var bank = Environment.GetEnvironmentVariable("SEPAY_BANK") ?? "MBBank";
                var amount = ((long)Math.Round(payment.Amount, 0)).ToString();
                var des = Uri.EscapeDataString(payment.Id);
                var qrUrl =
                    $"https://qr.sepay.vn/img?acc={acc}&bank={bank}&amount={amount}&des={des}";
                var holdMins = _configuration.GetValue<int?>("Booking:HoldMinutes") ?? 5;

                _emailService.SendEmailFireAndForget(
                    () =>
                        _emailService.SendPaymentRequestEmailAsync(
                            new Dtos.Email.SendPaymentRequestEmailAsyncRequest
                            {
                                To = payment.CustomerEmail!,
                                ToName = payment.CustomerName,
                                PaymentId = payment.Id,
                                Amount = payment.Amount.ToString("N0"),
                                CourtName = payment.CourtName,
                                StartDate = result.StartDate.ToString(),
                                StartTime = result.StartTime.ToString(),
                                EndTime = result.EndTime.ToString(),
                                QrUrl = qrUrl,
                                HoldMinutes = holdMins,
                            }
                        ),
                    _logger,
                    payment.Id
                );
            }
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

    [HttpPost("cancel")]
    public async Task<ActionResult<ApiResponse<bool>>> Cancel(
        [FromBody] CancelBookingCourtRequest request
    )
    {
        var ok = await _service.CancelBookingCourtAsync(request);
        return Ok(
            ApiResponse<bool>.SuccessResponse(ok, ok ? "Huỷ lịch thành công" : "Huỷ lịch thất bại")
        );
    }
}

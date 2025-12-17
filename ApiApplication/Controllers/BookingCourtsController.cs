using System.Collections.Generic;
using ApiApplication.Authorization;
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

    /// <summary>
    /// Create booking for customer - Staff access (Receptionist creates booking for customers)
    /// </summary>
    [HttpPost("create")]
    [Authorize(Policy = PolicyConstants.ReceptionistAccess)]
    public async Task<ActionResult<ApiResponse<CreateBookingCourtResponse>>> Create(
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
            ApiResponse<CreateBookingCourtResponse>.SuccessResponse(result, "Đặt sân thành công")
        );
    }

    /// <summary>
    /// Customer creates their own booking online - Accessible by all authenticated users
    /// </summary>
    [AllowAnonymous]
    [HttpPost("user/create")]
    public async Task<ActionResult<ApiResponse<CreateBookingCourtResponse>>> UserCreate(
        [FromBody] UserCreateBookingCourtRequest request
    )
    {
        var result = await _service.UserCreateBookingCourtAsync(request);

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
            ApiResponse<CreateBookingCourtResponse>.SuccessResponse(result, "Đặt sân thành công")
        );
    }

    [Authorize]
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

    /// <summary>
    /// Get user's booking history - Accessible by authenticated customers to view their own bookings
    /// </summary>
    [Authorize]
    [HttpGet("user/history")]
    public async Task<
        ActionResult<ApiResponse<List<ListUserBookingHistoryResponse>>>
    > GetUserBookingHistory()
    {
        var result = await _service.GetUserBookingHistoryAsync();
        return Ok(
            ApiResponse<List<ListUserBookingHistoryResponse>>.SuccessResponse(
                result,
                "Lấy lịch sử đặt sân thành công"
            )
        );
    }

    [AllowAnonymous]
    [HttpGet("occurrences")]
    public async Task<
        ActionResult<ApiResponse<List<ListBookingCourtOccurrenceResponse>>>
    > ListOccurrences([FromQuery] ListBookingCourtOccurrenceRequest request)
    {
        var result = await _service.ListBookingCourtOccurrencesAsync(request);
        return Ok(
            ApiResponse<List<ListBookingCourtOccurrenceResponse>>.SuccessResponse(
                result,
                "Lấy danh sách lịch sân thành công"
            )
        );
    }

    /// <summary>
    /// Get booking detail - Authenticated users (customers view their own, staff view all)
    /// </summary>
    [Authorize]
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

    [HttpGet("occurrence/detail")]
    public async Task<
        ActionResult<ApiResponse<DetailBookingCourtOccurrenceResponse>>
    > DetailOccurrence([FromQuery] DetailBookingCourtOccurrenceRequest request)
    {
        var result = await _service.DetailBookingCourtOccurrenceAsync(request);
        return Ok(
            ApiResponse<DetailBookingCourtOccurrenceResponse>.SuccessResponse(
                result,
                "Lấy chi tiết lịch sân thành công"
            )
        );
    }

    /// <summary>
    /// Cancel booking - Authenticated users (customers cancel their own, staff cancel any)
    /// </summary>
    [Authorize]
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

    [HttpPost("checkin")]
    public async Task<ActionResult<ApiResponse<bool>>> CheckIn(
        [FromBody] CheckInBookingCourtRequest request
    )
    {
        var ok = await _service.CheckInOccurrenceAsync(request);
        return Ok(
            ApiResponse<bool>.SuccessResponse(ok, ok ? "Check-in thành công" : "Check-in thất bại")
        );
    }

    [HttpPost("checkout")]
    public async Task<ActionResult<ApiResponse<bool>>> CheckOut(
        [FromBody] CheckOutBookingCourtRequest request
    )
    {
        var ok = await _service.CheckOutOccurrenceAsync(request);
        return Ok(
            ApiResponse<bool>.SuccessResponse(
                ok,
                ok ? "Check-out thành công" : "Check-out thất bại"
            )
        );
    }

    [HttpPost("noshow")]
    public async Task<ActionResult<ApiResponse<bool>>> NoShow(
        [FromBody] NoShowBookingCourtRequest request
    )
    {
        var ok = await _service.MarkOccurrenceNoShowAsync(request);
        return Ok(
            ApiResponse<bool>.SuccessResponse(
                ok,
                ok ? "Đánh dấu no-show thành công" : "Đánh dấu no-show thất bại"
            )
        );
    }

    [HttpPost("order/add-item")]
    public async Task<ActionResult<ApiResponse<bool>>> AddOrderItem(
        [FromBody] AddOrderItemRequest request
    )
    {
        var ok = await _service.AddOrderItemAsync(request);
        return Ok(
            ApiResponse<bool>.SuccessResponse(
                ok,
                ok ? "Lưu tạm món thành công" : "Lưu tạm thất bại"
            )
        );
    }

    [HttpGet("order/list")]
    public async Task<ActionResult<ApiResponse<List<BookingOrderItemResponse>>>> ListOrderItems(
        [FromQuery] Guid bookingId
    )
    {
        var items = await _service.ListOrderItemsAsync(bookingId);
        return Ok(
            ApiResponse<List<BookingOrderItemResponse>>.SuccessResponse(
                items,
                "Lấy danh sách món tạm thành công"
            )
        );
    }

    [HttpPost("order/update-item")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateOrderItem(
        [FromBody] UpdateOrderItemRequest request
    )
    {
        var ok = await _service.UpdateOrderItemAsync(request);
        return Ok(
            ApiResponse<bool>.SuccessResponse(
                ok,
                ok ? "Cập nhật món thành công" : "Cập nhật món thất bại"
            )
        );
    }
}

using ApiApplication.Dtos;
using ApiApplication.Dtos.Order;
using ApiApplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController(IOrderService orderService) : ControllerBase
{
    private readonly IOrderService _orderService = orderService;

    /// <summary>
    /// Checkout đơn hàng cho booking đang check-in
    /// </summary>
    [HttpPost("checkout")]
    public async Task<ActionResult<ApiResponse<CheckoutResponse>>> CheckoutAsync(
        [FromBody] CheckoutRequest request
    )
    {
        var result = await _orderService.CheckoutAsync(request);
        return Ok(ApiResponse<CheckoutResponse>.SuccessResponse(result, "Tạo đơn hàng thành công"));
    }

    /// <summary>
    /// Lấy thông tin đơn hàng theo ID
    /// </summary>
    [HttpGet("{orderId}")]
    public async Task<ActionResult<ApiResponse<OrderResponse>>> GetOrderByIdAsync(Guid orderId)
    {
        var result = await _orderService.GetOrderByIdAsync(orderId);
        return Ok(
            ApiResponse<OrderResponse>.SuccessResponse(result, "Lấy thông tin đơn hàng thành công")
        );
    }

    /// <summary>
    /// Lấy danh sách đơn hàng theo Booking ID
    /// </summary>
    [HttpGet("booking/{bookingId}")]
    public async Task<ActionResult<ApiResponse<List<OrderResponse>>>> GetOrdersByBookingIdAsync(
        Guid bookingId
    )
    {
        var result = await _orderService.GetOrdersByBookingIdAsync(bookingId);
        return Ok(
            ApiResponse<List<OrderResponse>>.SuccessResponse(
                result,
                "Lấy danh sách đơn hàng thành công"
            )
        );
    }

    /// <summary>
    /// Lấy danh sách đơn hàng chờ thanh toán
    /// </summary>
    [HttpGet("pending-payments")]
    public async Task<ActionResult<ApiResponse<List<OrderResponse>>>> GetPendingPaymentOrdersAsync(
        [FromQuery] string? status = null,
        [FromQuery] string? paymentMethod = null
    )
    {
        var result = await _orderService.GetPendingPaymentOrdersAsync(status, paymentMethod);
        return Ok(
            ApiResponse<List<OrderResponse>>.SuccessResponse(
                result,
                "Lấy danh sách đơn hàng chờ thanh toán thành công"
            )
        );
    }

    /// <summary>
    /// Lấy thông tin checkout từ OrderId
    /// </summary>
    [HttpGet("checkout/{orderId}")]
    public async Task<ActionResult<ApiResponse<CheckoutResponse>>> GetCheckoutInfoAsync(
        Guid orderId
    )
    {
        var result = await _orderService.GetCheckoutInfoAsync(orderId);
        return Ok(
            ApiResponse<CheckoutResponse>.SuccessResponse(
                result,
                "Lấy thông tin checkout thành công"
            )
        );
    }

    /// <summary>
    /// Xác nhận thanh toán cho đơn hàng (dành cho thanh toán chuyển khoản)
    /// </summary>
    [HttpPost("{orderId}/confirm-payment")]
    public async Task<ActionResult<ApiResponse<bool>>> ConfirmPaymentAsync(Guid orderId)
    {
        var result = await _orderService.ConfirmPaymentAsync(orderId);
        return Ok(ApiResponse<bool>.SuccessResponse(result, "Xác nhận thanh toán thành công"));
    }
}

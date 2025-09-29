using ApiApplication.Dtos;
using ApiApplication.Dtos.Invoice;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class InvoicesController(IInvoiceService invoiceService) : ControllerBase
{
	private readonly IInvoiceService _invoiceService = invoiceService;

	[HttpGet("by-booking")] 
	public async Task<ActionResult<ApiResponse<DetailInvoiceResponse?>>> GetByBooking([FromQuery] Guid bookingId)
	{
		var dto = await _invoiceService.GetByBookingIdAsync(bookingId);
		return Ok(ApiResponse<DetailInvoiceResponse?>.SuccessResponse(dto, "Lấy hóa đơn thành công"));
	}

	[HttpGet("detail")] 
	public async Task<ActionResult<ApiResponse<DetailInvoiceResponse?>>> Detail([FromQuery] Guid id)
	{
		var dto = await _invoiceService.GetByIdAsync(id);
		return Ok(ApiResponse<DetailInvoiceResponse?>.SuccessResponse(dto, "Lấy hóa đơn thành công"));
	}
}



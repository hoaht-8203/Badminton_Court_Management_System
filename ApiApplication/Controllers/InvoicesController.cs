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

	[HttpGet("detail-invoice-by-booking-id")] 
	public async Task<ActionResult<ApiResponse<DetailInvoiceResponse?>>> GetByBooking([FromQuery] DetailInvoiceByBookingIdRequest request)
	{
		var dto = await _invoiceService.DetailByBookingIdAsync(request);
		return Ok(ApiResponse<DetailInvoiceResponse?>.SuccessResponse(dto, "Lấy hóa đơn thành công"));
	}

	[HttpGet("detail-invoice-by-id")] 
	public async Task<ActionResult<ApiResponse<DetailInvoiceResponse?>>> Detail([FromQuery] DetailInvoiceRequest request)
	{
		var dto = await _invoiceService.DetailInvoiceByIdAsync(request);
		return Ok(ApiResponse<DetailInvoiceResponse?>.SuccessResponse(dto, "Lấy hóa đơn thành công"));
	}
}



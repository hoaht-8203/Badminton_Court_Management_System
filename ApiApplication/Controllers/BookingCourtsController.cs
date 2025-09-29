using ApiApplication.Dtos;
using ApiApplication.Dtos.BookingCourt;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class BookingCourtsController(IBookingCourtService service) : ControllerBase
{
	private readonly IBookingCourtService _service = service;

	[HttpPost("create")]
    public async Task<ActionResult<ApiResponse<DetailBookingCourtResponse>>> Create([FromBody] CreateBookingCourtRequest request)
	{
        var result = await _service.CreateBookingCourtAsync(request);
        return Ok(ApiResponse<DetailBookingCourtResponse>.SuccessResponse(result, "Đặt sân thành công"));
	}

	[HttpGet("list")]
    public async Task<ActionResult<ApiResponse<List<ListBookingCourtResponse>>>> List([FromQuery] ListBookingCourtRequest request)
    {
        var result = await _service.ListBookingCourtsAsync(request);
        return Ok(ApiResponse<List<ListBookingCourtResponse>>.SuccessResponse(result, "Lấy danh sách booking thành công"));
    }
}



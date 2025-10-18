using ApiApplication.Dtos;
using ApiApplication.Dtos.Cashflow;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CashflowsController(ICashflowService cashflowService) : ControllerBase
{
    private readonly ICashflowService _cashflowService = cashflowService;

    [HttpGet("list")]
    public async Task<ApiResponse<CashflowResponse[]>> List([FromQuery] ListCashflowRequest request)
    {
        var data = await _cashflowService.ListAsync(request);
        return ApiResponse<CashflowResponse[]>.SuccessResponse(data);
    }

    [HttpGet("detail")]
    public async Task<ApiResponse<CashflowResponse>> Detail([FromQuery] DetailCashflowRequest request)
    {
        var item = await _cashflowService.DetailAsync(request);
        
        return ApiResponse<CashflowResponse>.SuccessResponse(item!);
    }

    [HttpPost("create-receipt")]
    public async Task<ApiResponse<object?>> CreateReceipt([FromBody] CreateCashflowRequest request)
    {
        var id = await _cashflowService.CreateReceiptAsync(request);
        return ApiResponse<object?>.SuccessResponse(new { id }, "Tạo phiếu thu thành công");
    }

    [HttpPost("create-payment")]
    public async Task<ApiResponse<object?>> CreatePayment([FromBody] CreateCashflowRequest request)
    {
        var id = await _cashflowService.CreatePaymentAsync(request);
        return ApiResponse<object?>.SuccessResponse(new { id }, "Tạo phiếu chi thành công");
    }

    [HttpPut("update")]
    public async Task<ApiResponse<object?>> Update([FromBody] UpdateCashflowRequest request)
    {
        await _cashflowService.UpdateAsync(request);
        return ApiResponse<object?>.SuccessResponse(null, "Cập nhật phiếu quỹ thành công");
    }

    [HttpDelete("delete/{id}")]
    public async Task<ApiResponse<object?>> Delete([FromRoute] int id)
    {
        await _cashflowService.DeleteAsync(id);
        return ApiResponse<object?>.SuccessResponse(null, "Xóa phiếu quỹ thành công");
    }

}





using ApiApplication.Authorization;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Cashflow;
using ApiApplication.Entities;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = PolicyConstants.ManagementOnly)]
public class CashflowsController(
    ICashflowService cashflowService,
    ICashflowTypeService cashflowTypeService
) : ControllerBase
{
    private readonly ICashflowService _cashflowService = cashflowService;
    private readonly ICashflowTypeService _cashflowTypeService = cashflowTypeService;

    [HttpGet]
    public async Task<ApiResponse<CashflowResponse[]>> List([FromQuery] ListCashflowRequest request)
    {
        var data = await _cashflowService.ListAsync(request);
        return ApiResponse<CashflowResponse[]>.SuccessResponse(data);
    }

    [HttpGet("{id}")]
    public async Task<ApiResponse<CashflowResponse>> Detail([FromRoute] int id)
    {
        var item = await _cashflowService.DetailAsync(id);
        return ApiResponse<CashflowResponse>.SuccessResponse(item!);
    }

    [HttpPost]
    public async Task<ApiResponse<object?>> CreateCashflow([FromBody] CreateCashflowRequest request)
    {
        var id = await _cashflowService.CreateCashflowAsync(request);
        return ApiResponse<object?>.SuccessResponse(new { id }, "Tạo phiếu thu thành công");
    }

    [HttpPut("{id}")]
    public async Task<ApiResponse<object?>> Update(
        [FromRoute] int id,
        [FromBody] UpdateCashflowRequest request
    )
    {
        await _cashflowService.UpdateAsync(id, request);
        return ApiResponse<object?>.SuccessResponse(null, "Cập nhật phiếu quỹ thành công");
    }

    [HttpDelete("{id}")]
    public async Task<ApiResponse<object?>> Delete([FromRoute] int id)
    {
        await _cashflowService.DeleteAsync(id);
        return ApiResponse<object?>.SuccessResponse(null, "Xóa phiếu quỹ thành công");
    }

    //types?isPayment=true
    [HttpGet("types")]
    public async Task<ApiResponse<List<CashflowType>>> GetTypes([FromQuery] bool isPayment)
    {
        var types = await _cashflowTypeService.GetAllCashflowTypesAsync(isPayment);
        return ApiResponse<List<CashflowType>>.SuccessResponse(types);
    }

    [HttpGet("related-persons")]
    public async Task<ApiResponse<List<string>>> GetRelatedPersons([FromQuery] string personType)
    {
        var relatedPersons = await _cashflowService.GetRelatedPersonsAsync(personType);
        return ApiResponse<List<string>>.SuccessResponse(relatedPersons);
    }
}

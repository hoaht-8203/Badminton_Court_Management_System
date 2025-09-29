using System.Threading;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Customer;
using ApiApplication.Dtos.Pagination;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CustomersController(ICustomerService customerService) : ControllerBase
{
    private readonly ICustomerService _customerService = customerService;

    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<List<ListCustomerResponse>>>> ListCustomers(
        [FromQuery] ListCustomerRequest request
    )
    {
        var result = await _customerService.ListCustomersAsync(request);
        return Ok(
            ApiResponse<List<ListCustomerResponse>>.SuccessResponse(
                result,
                "Get customer list successfully"
            )
        );
    }

    [HttpGet("list-paged")]
    public async Task<
        ActionResult<ApiResponse<PagedResponse<ListCustomerResponse>>>
    > ListCustomersPaged(
        [FromQuery] ListCustomerPagedRequest request,
        CancellationToken cancellationToken
    )
    {
        var result = await _customerService.ListCustomersPagedAsync(request, cancellationToken);
        return Ok(
            ApiResponse<PagedResponse<ListCustomerResponse>>.SuccessResponse(
                result,
                "Get customer list successfully"
            )
        );
    }

    [HttpGet("detail")]
    public async Task<ActionResult<ApiResponse<DetailCustomerResponse>>> DetailCustomer(
        [FromQuery] DetailCustomerRequest request
    )
    {
        var result = await _customerService.GetCustomerByIdAsync(request);
        return Ok(
            ApiResponse<DetailCustomerResponse>.SuccessResponse(
                result,
                "Get customer information successfully"
            )
        );
    }

    [HttpPost("create")]
    public async Task<ActionResult<ApiResponse<DetailCustomerResponse>>> CreateCustomer(
        [FromBody] CreateCustomerRequest request
    )
    {
        var result = await _customerService.CreateCustomerAsync(request);
        return Ok(
            ApiResponse<DetailCustomerResponse>.SuccessResponse(
                result,
                "Create successful customers"
            )
        );
    }

    [HttpPut("update")]
    public async Task<ActionResult<ApiResponse<DetailCustomerResponse>>> UpdateCustomer(
        [FromBody] UpdateCustomerRequest request
    )
    {
        var result = await _customerService.UpdateCustomerAsync(request);
        return Ok(
            ApiResponse<DetailCustomerResponse>.SuccessResponse(
                result,
                "Customer update successful"
            )
        );
    }

    [HttpDelete("delete")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteCustomer(
        [FromBody] DeleteCustomerRequest request
    )
    {
        var result = await _customerService.DeleteCustomerAsync(request);
        return Ok(ApiResponse<bool>.SuccessResponse(result, "Customer deleted successfully"));
    }

    [HttpPut("change-status")]
    public async Task<ActionResult<ApiResponse<DetailCustomerResponse>>> ChangeCustomerStatus(
        [FromBody] ChangeCustomerStatusRequest request
    )
    {
        var result = await _customerService.ChangeCustomerStatusAsync(request);
        return Ok(
            ApiResponse<DetailCustomerResponse>.SuccessResponse(
                result,
                "Change customer status successfully"
            )
        );
    }
}

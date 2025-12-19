using ApiApplication.Authorization;
using ApiApplication.Dtos;
using ApiApplication.Dtos.StoreBankAccount;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/store-bank-accounts")]
[ApiController]
[Authorize(Policy = PolicyConstants.StaffAccess)]
public class StoreBankAccountsController(IStoreBankAccountService service) : ControllerBase
{
    private readonly IStoreBankAccountService _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<StoreBankAccountResponse>>>> ListAsync()
    {
        var list = await _service.ListAsync();
        return Ok(
            ApiResponse<IEnumerable<StoreBankAccountResponse>>.SuccessResponse(
                list,
                "Lấy danh sách tài khoản ngân hàng cửa hàng thành công"
            )
        );
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<StoreBankAccountResponse>>> CreateAsync(
        [FromBody] CreateStoreBankAccountRequest req
    )
    {
        // Check if account number already exists
        var existingAccounts = await _service.ListAsync();
        if (existingAccounts.Any(x => x.AccountNumber == req.AccountNumber))
        {
            return BadRequest(
                ApiResponse<StoreBankAccountResponse>.ErrorResponse(
                    "Số tài khoản đã tồn tại trong hệ thống"
                )
            );
        }

        var res = await _service.CreateAsync(req);
        return Ok(
            ApiResponse<StoreBankAccountResponse>.SuccessResponse(
                res,
                "Tạo tài khoản ngân hàng cửa hàng thành công"
            )
        );
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<object?>>> UpdateAsync(
        [FromRoute] int id,
        [FromBody] CreateStoreBankAccountRequest req
    )
    {
        // Check if account number already exists (excluding current record)
        var existingAccounts = await _service.ListAsync();
        if (existingAccounts.Any(x => x.AccountNumber == req.AccountNumber && x.Id != id))
        {
            return BadRequest(
                ApiResponse<object?>.ErrorResponse("Số tài khoản đã tồn tại trong hệ thống")
            );
        }

        await _service.UpdateAsync(id, req);
        return Ok(
            ApiResponse<object?>.SuccessResponse(
                null,
                "Cập nhật tài khoản ngân hàng cửa hàng thành công"
            )
        );
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object?>>> DeleteAsync([FromRoute] int id)
    {
        await _service.DeleteAsync(id);
        return Ok(
            ApiResponse<object?>.SuccessResponse(
                null,
                "Xóa tài khoản ngân hàng cửa hàng thành công"
            )
        );
    }
}

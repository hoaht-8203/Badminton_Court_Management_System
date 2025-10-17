using ApiApplication.Dtos;
using ApiApplication.Dtos.SupplierBankAccount;
using ApiApplication.Entities;
using Microsoft.AspNetCore.Mvc;
using ApiApplication.Services;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SupplierBankAccountsController(ISupplierBankAccountService service) : ControllerBase
{
    private readonly ISupplierBankAccountService _service = service;

    

    [HttpGet("list")] 
    public async Task<ActionResult<ApiResponse<List<SupplierBankAccount>>>> List([FromQuery] int supplierId)
    {
        var list = await _service.ListAsync(supplierId);
        return Ok(ApiResponse<List<SupplierBankAccount>>.SuccessResponse(list, "Lấy danh sách ngân hàng thành công"));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<int>>> Create([FromBody] UpsertBankAccountRequest req)
    {
        // Check if account number already exists for this supplier
        var existingAccounts = await _service.ListAsync(req.SupplierId);
        if (existingAccounts.Any(x => x.AccountNumber == req.AccountNumber))
        {
            return BadRequest(ApiResponse<int>.ErrorResponse("Số tài khoản đã tồn tại cho nhà cung cấp này"));
        }

        var id = await _service.CreateAsync(req);
        return Ok(ApiResponse<int>.SuccessResponse(id, "Tạo ngân hàng thành công"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<string>>> Update(int id, [FromBody] UpsertBankAccountRequest req)
    {
        // Check if account number already exists for this supplier (excluding current record)
        var existingAccounts = await _service.ListAsync(req.SupplierId);
        if (existingAccounts.Any(x => x.AccountNumber == req.AccountNumber && x.Id != id))
        {
            return BadRequest(ApiResponse<string>.ErrorResponse("Số tài khoản đã tồn tại cho nhà cung cấp này"));
        }

        await _service.UpdateAsync(id, req);
        return Ok(ApiResponse<string>.SuccessResponse("OK"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<string>>> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return Ok(ApiResponse<string>.SuccessResponse("OK"));
    }
}



using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SupplierController(ISupplierService supplierService) : ControllerBase
    {
        private readonly ISupplierService _supplierService = supplierService;

        [HttpGet("list")]
        public async Task<ActionResult<ApiResponse<List<ListSupplierResponse>>>> ListSuppliers(
            [FromQuery] ListSupplierRequest request
        )
        {
            var result = await _supplierService.ListSupplierAsync(request);
            return Ok(
                ApiResponse<List<ListSupplierResponse>>.SuccessResponse(
                    result,
                    "Lấy danh sách nhà cung cấp thành công"
                )
            );
        }

        [HttpGet("detail")]
        public async Task<ActionResult<ApiResponse<DetailSupplierResponse>>> DetailCustomer(
            [FromQuery] DetailSupplierRequest request
        )
        {
            var result = await _supplierService.GetSupplierByIdAsync(request.Id);
            return Ok(
                ApiResponse<DetailSupplierResponse>.SuccessResponse(
                    result,
                    "Lấy chi tiết nhà cung cấp thành công"
                )
            );
        }

        [HttpPost("create")]
        public async Task<ActionResult<ApiResponse<object?>>> CreateCustomer(
            [FromBody] CreateSupplierRequest request
        )
        {
            await _supplierService.CreateSupplierAsync(request);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Tạo nhà cung cấp thành công"));
        }

        [HttpPut("update")]
        public async Task<ActionResult<ApiResponse<object?>>> UpdateCustomer(
            [FromBody] UpdateSupplierRequest request
        )
        {
            await _supplierService.UpdateSupplierAsync(request);
            return Ok(
                ApiResponse<object?>.SuccessResponse(null, "Cập nhật nhà cung cấp thành công")
            );
        }

        [HttpDelete("delete")]
        public async Task<ActionResult<ApiResponse<object?>>> DeleteCustomer(
            [FromQuery] DeleteSupplierRequest request
        )
        {
            await _supplierService.DeleteSupplierAsync(request);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Xóa nhà cung cấp thành công"));
        }

        [HttpPut("change-status")]
        public async Task<ActionResult<ApiResponse<object?>>> ChangeCustomerStatus(
            [FromBody] ChangeSupplierStatusRequest request
        )
        {
            await _supplierService.ChangeSupplierStatusAsync(request);
            return Ok(
                ApiResponse<object?>.SuccessResponse(
                    null,
                    "Thay đổi trạng thái nhà cung cấp thành công"
                )
            );
        }
    }
}

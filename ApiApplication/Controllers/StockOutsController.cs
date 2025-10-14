using ApiApplication.Dtos;
using ApiApplication.Dtos.StockOut;
using ApiApplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StockOutsController : ControllerBase
    {
        private readonly IStockOutService _stockOutService;

        public StockOutsController(IStockOutService stockOutService)
        {
            _stockOutService = stockOutService;
        }

        public record ListStockOutRequest(DateTime? From, DateTime? To, int? Status);

        [HttpGet("list")]
        public async Task<ApiResponse<List<ListStockOutResponse>>> List([FromQuery] ListStockOutRequest req)
        {
            try
            {
                var result = await _stockOutService.ListAsync(req.From, req.To, req.Status);
                return ApiResponse<List<ListStockOutResponse>>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponse<List<ListStockOutResponse>>.ErrorResponse(ex.Message);
            }
        }

        [HttpGet("detail/{id}")]
        public async Task<ApiResponse<DetailStockOutResponse>> Detail(int id)
        {
            try
            {
                var result = await _stockOutService.DetailAsync(id);
                return ApiResponse<DetailStockOutResponse>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponse<DetailStockOutResponse>.ErrorResponse(ex.Message);
            }
        }

        [HttpPost("create")]
        public async Task<ApiResponse<int>> Create([FromBody] CreateStockOutRequest request)
        {
            try
            {
                var result = await _stockOutService.CreateAsync(request);
                return ApiResponse<int>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponse<int>.ErrorResponse(ex.Message);
            }
        }

        [HttpPut("update/{id}")]
        public async Task<ApiResponse<object>> Update(int id, [FromBody] CreateStockOutRequest request)
        {
            try
            {
                await _stockOutService.UpdateAsync(id, request);
                return ApiResponse<object>.SuccessResponse(null);
            }
            catch (Exception ex)
            {
                return ApiResponse<object>.ErrorResponse(ex.Message);
            }
        }

        [HttpPost("complete/{id}")]
        public async Task<ApiResponse<object>> Complete(int id)
        {
            try
            {
                await _stockOutService.CompleteAsync(id);
                return ApiResponse<object>.SuccessResponse(null);
            }
            catch (Exception ex)
            {
                return ApiResponse<object>.ErrorResponse(ex.Message);
            }
        }

        [HttpPost("cancel/{id}")]
        public async Task<ApiResponse<object>> Cancel(int id)
        {
            try
            {
                await _stockOutService.CancelAsync(id);
                return ApiResponse<object>.SuccessResponse(null);
            }
            catch (Exception ex)
            {
                return ApiResponse<object>.ErrorResponse(ex.Message);
            }
        }
    }
}

using ApiApplication.Dtos;
using ApiApplication.Dtos.ReturnGoods;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReturnGoodsController : ControllerBase
    {
        private readonly IReturnGoodsService _returnGoodsService;

        public ReturnGoodsController(IReturnGoodsService returnGoodsService)
        {
            _returnGoodsService = returnGoodsService;
        }

        [HttpGet("list")]
        public async Task<ApiResponse<List<ListReturnGoodsResponse>>> List([FromQuery] ListReturnGoodsRequest request)
        {
            try
            {
                var result = await _returnGoodsService.ListAsync(request.From, request.To, request.Status);
                return ApiResponse<List<ListReturnGoodsResponse>>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponse<List<ListReturnGoodsResponse>>.ErrorResponse(ex.Message);
            }
        }

        [HttpGet("detail/{id}")]
        public async Task<ApiResponse<DetailReturnGoodsResponse>> Detail(int id)
        {
            try
            {
                var result = await _returnGoodsService.DetailAsync(id);
                return ApiResponse<DetailReturnGoodsResponse>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponse<DetailReturnGoodsResponse>.ErrorResponse(ex.Message);
            }
        }

        [HttpPost("create")]
        public async Task<ApiResponse<int>> Create([FromBody] CreateReturnGoodsRequest request)
        {
            try
            {
                var result = await _returnGoodsService.CreateAsync(request);
                return ApiResponse<int>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponse<int>.ErrorResponse(ex.Message);
            }
        }

        [HttpPut("update/{id}")]
        public async Task<ApiResponse<object>> Update(int id, [FromBody] CreateReturnGoodsRequest request)
        {
            try
            {
                await _returnGoodsService.UpdateAsync(id, request);
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
                await _returnGoodsService.CompleteAsync(id);
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
                await _returnGoodsService.CancelAsync(id);
                return ApiResponse<object>.SuccessResponse(null);
            }
            catch (Exception ex)
            {
                return ApiResponse<object>.ErrorResponse(ex.Message);
            }
        }
    }
}

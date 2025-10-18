using ApiApplication.Dtos.ReturnGoods;

namespace ApiApplication.Services
{
    public interface IReturnGoodsService
    {
        Task<List<ListReturnGoodsResponse>> ListAsync(DateTime? from, DateTime? to, int? status);
        Task<DetailReturnGoodsResponse> DetailAsync(int id);
        Task<int> CreateAsync(CreateReturnGoodsRequest request);
        Task UpdateAsync(int id, CreateReturnGoodsRequest request);
        Task CompleteAsync(int id);
        Task CancelAsync(int id);
    }
}

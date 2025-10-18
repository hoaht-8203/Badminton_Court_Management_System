namespace ApiApplication.Dtos.ReturnGoods
{
    public record ListReturnGoodsRequest(DateTime? From, DateTime? To, int? Status);
}

namespace ApiApplication.Dtos.ReturnGoods
{
    public class CreateReturnGoodsItem
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal ImportPrice { get; set; }
        public decimal ReturnPrice { get; set; }
        public decimal Discount { get; set; }
        public string? Note { get; set; }
    }
}

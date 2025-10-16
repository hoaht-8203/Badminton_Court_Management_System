namespace ApiApplication.Dtos.ReturnGoods
{
    public class DetailReturnGoodsItem
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string? ProductCode { get; set; }
        public string? ProductName { get; set; }
        public int Quantity { get; set; }
        public decimal ImportPrice { get; set; }
        public decimal ReturnPrice { get; set; }
        public decimal Discount { get; set; }
        public decimal LineTotal { get; set; }
        public string? Note { get; set; }
    }
}

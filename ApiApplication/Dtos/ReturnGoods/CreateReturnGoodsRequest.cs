namespace ApiApplication.Dtos.ReturnGoods
{
    public class CreateReturnGoodsRequest
    {
        public DateTime ReturnTime { get; set; }
        public int SupplierId { get; set; }
        public string? ReturnBy { get; set; }
        public string? Note { get; set; }
        public decimal Discount { get; set; }
        public decimal SupplierPaid { get; set; }
        public bool Complete { get; set; }
        public List<CreateReturnGoodsItem> Items { get; set; } = new();
    }
}

namespace ApiApplication.Dtos.ReturnGoods
{
    public class DetailReturnGoodsResponse
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public DateTime ReturnTime { get; set; }
        public int SupplierId { get; set; }
        public string? SupplierName { get; set; }
        public string? ReturnBy { get; set; }
        public string? CreatedBy { get; set; }
        public decimal TotalValue { get; set; }
        public decimal Discount { get; set; }
        public decimal SupplierNeedToPay { get; set; }
        public decimal SupplierPaid { get; set; }
        public int PaymentMethod { get; set; }
        public int? StoreBankAccountId { get; set; }
        public string? StoreBankAccountNumber { get; set; }
        public string? StoreBankAccountName { get; set; }
        public string? StoreBankName { get; set; }
        public string? Note { get; set; }
        public int Status { get; set; }
        public List<DetailReturnGoodsItem> Items { get; set; } = new();
    }
}

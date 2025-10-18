namespace ApiApplication.Dtos.StockOut
{
    public class DetailStockOutItem
    {
        public int ProductId { get; set; }
        public string? ProductCode { get; set; }
        public string? ProductName { get; set; }
        public int Quantity { get; set; }
        public decimal CostPrice { get; set; }
        public string? Note { get; set; }
    }
}

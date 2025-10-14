namespace ApiApplication.Dtos.StockOut
{
    public class DetailStockOutItem
    {
        public int ProductId { get; set; }
        public string ProductCode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal CostPrice { get; set; }
        public string? Note { get; set; }
    }
}

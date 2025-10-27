namespace ApiApplication.Dtos.StockOut
{
    public class CreateStockOutItem
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal CostPrice { get; set; }
        public string? Note { get; set; }
    }
}

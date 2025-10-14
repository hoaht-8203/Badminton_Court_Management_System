namespace ApiApplication.Dtos.StockOut
{
    public class CreateStockOutRequest
    {
        public DateTime OutTime { get; set; }
        public int SupplierId { get; set; }
        public string? OutBy { get; set; }
        public string? Note { get; set; }
        public bool Complete { get; set; }
        public List<CreateStockOutItem> Items { get; set; } = new();
    }
}

namespace ApiApplication.Dtos.StockOut
{
    public class DetailStockOutResponse
    {
        public int Id { get; set; }
        public string? Code { get; set; }
        public DateTime OutTime { get; set; }
        public int SupplierId { get; set; }
        public string? SupplierName { get; set; }
        public string? OutBy { get; set; }
        public string? CreatedBy { get; set; }
        public decimal TotalValue { get; set; }
        public string? Note { get; set; }
        public int Status { get; set; }
        public List<DetailStockOutItem> Items { get; set; } = new();
    }
}

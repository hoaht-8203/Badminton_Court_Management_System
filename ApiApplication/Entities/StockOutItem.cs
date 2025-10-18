using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Entities
{
    public class StockOutItem
    {
        [Key]
        public int Id { get; set; }

        public int StockOutId { get; set; }

        public int ProductId { get; set; }

        public int Quantity { get; set; }

        public decimal CostPrice { get; set; }

        [StringLength(500)]
        public string? Note { get; set; }

        // Navigation properties
        public virtual StockOut StockOut { get; set; } = null!;
        public virtual Product Product { get; set; } = null!;
    }
}

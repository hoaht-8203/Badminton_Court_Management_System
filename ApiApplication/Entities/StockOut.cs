using System.ComponentModel.DataAnnotations;
using ApiApplication.Constants;

namespace ApiApplication.Entities
{
    public class StockOut
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string Code { get; set; } = string.Empty;
        
        public DateTime OutTime { get; set; } = DateTime.UtcNow;
        
        public int SupplierId { get; set; }
        public virtual Supplier Supplier { get; set; } = null!;
        
        [StringLength(100)]
        public string? OutBy { get; set; }
        
        [StringLength(100)]
        public string? CreatedBy { get; set; }
        
        [StringLength(500)]
        public string? Note { get; set; }
        
        public decimal TotalValue { get; set; }
        
        public StockOutStatus Status { get; set; }
        
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public virtual ICollection<StockOutItem> Items { get; set; } = new List<StockOutItem>();
    }
}

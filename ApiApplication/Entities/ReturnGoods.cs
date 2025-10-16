using System.ComponentModel.DataAnnotations;
using ApiApplication.Enums;

namespace ApiApplication.Entities
{
    public class ReturnGoods
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string Code { get; set; } = string.Empty;
        
        public DateTime ReturnTime { get; set; } = DateTime.UtcNow;
        
        public int SupplierId { get; set; }
        public virtual Supplier Supplier { get; set; } = null!;
        
        [StringLength(100)]
        public string? ReturnBy { get; set; }
        
        [StringLength(100)]
        public string? CreatedBy { get; set; }
        
        [StringLength(500)]
        public string? Note { get; set; }
        
        public decimal TotalValue { get; set; }
        public decimal Discount { get; set; }
        public decimal SupplierNeedToPay { get; set; }
        public decimal SupplierPaid { get; set; }
        
        // Payment method and store bank account (optional)
        public int PaymentMethod { get; set; } = 0; // 0=cash,1=transfer
        public int? StoreBankAccountId { get; set; }
        public virtual StoreBankAccount? StoreBankAccount { get; set; }

        public ReturnGoodsStatus Status { get; set; }
        
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public virtual ICollection<ReturnGoodsItem> Items { get; set; } = new List<ReturnGoodsItem>();
    }
}

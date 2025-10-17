using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Entities
{
    public class ReturnGoodsItem
    {
        [Key]
        public int Id { get; set; }

        public int ReturnGoodsId { get; set; }
        public virtual ReturnGoods ReturnGoods { get; set; } = null!;

        public int ProductId { get; set; }
        public virtual Product Product { get; set; } = null!;

        public int Quantity { get; set; }
        public decimal ImportPrice { get; set; }
        public decimal ReturnPrice { get; set; }
        public decimal Discount { get; set; }
        public decimal LineTotal { get; set; }

        [StringLength(500)]
        public string? Note { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}

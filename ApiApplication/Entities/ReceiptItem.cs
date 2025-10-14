using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Entities;

public class ReceiptItem
{
    [Key]
    public int Id { get; set; }

    public int ReceiptId { get; set; }
    public virtual Receipt Receipt { get; set; } = null!;

    public int ProductId { get; set; }
    public virtual Product Product { get; set; } = null!;

    public int Quantity { get; set; }
    public decimal CostPrice { get; set; }
}



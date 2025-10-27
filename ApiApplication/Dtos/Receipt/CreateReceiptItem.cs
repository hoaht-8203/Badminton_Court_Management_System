using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Receipt;

public class CreateReceiptItem
{
    [Required]
    public int ProductId { get; set; }

    [Range(0, int.MaxValue)]
    public int Quantity { get; set; }

    [Range(0, double.MaxValue)]
    public decimal CostPrice { get; set; }
}

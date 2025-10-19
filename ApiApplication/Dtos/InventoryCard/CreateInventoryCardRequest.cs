using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.InventoryCard;

public class CreateInventoryCardRequest
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    public int QuantityChange { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }

    public bool UpdateProductStock { get; set; } = true;
}

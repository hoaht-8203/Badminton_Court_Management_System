using System;
using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.InventoryCard;


public class UpdateInventoryCardRequest
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    [MaxLength(20)]
    public string? Code { get; set; }

    [Required]
    [MaxLength(100)]
    public string? Method { get; set; }

    [Required]
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;

    [Required]
    public decimal CostPrice { get; set; }

    [Required]
    public int QuantityChange { get; set; } // + (nhập hàng), - (bán hàng)

    [MaxLength(500)]
    public string? Note { get; set; }

  
    public bool UpdateProductStock { get; set; } = true;
}

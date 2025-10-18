using System;
using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.InventoryCard;


public class CreateInventoryCardForPurchaseRequest
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    [MaxLength(20)]
    public string? Code { get; set; }

    [Required]
    [MaxLength(100)]
    public string Method { get; set; } = "Nhập hàng";

    [Required]
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;

    [Required]
    public decimal CostPrice { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Số lượng nhập phải lớn hơn 0")]
    public int QuantityPurchased { get; set; } // Số lượng nhập (luôn dương)

    [MaxLength(500)]
    public string? Note { get; set; }

   
    public bool UpdateProductStock { get; set; } = true;
}

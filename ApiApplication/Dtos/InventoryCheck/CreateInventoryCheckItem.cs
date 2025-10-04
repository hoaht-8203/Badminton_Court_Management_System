using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.InventoryCheck;

public class CreateInventoryCheckItem
{
    [Required]
    public int ProductId { get; set; }

    public int SystemQuantity { get; set; }

    public int ActualQuantity { get; set; }
} 
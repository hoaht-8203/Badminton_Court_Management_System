using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class InventoryCheckItem : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [ForeignKey(nameof(InventoryCheck))]
    public int InventoryCheckId { get; set; }
    public InventoryCheck InventoryCheck { get; set; } = null!;

    [ForeignKey(nameof(Product))]
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int SystemQuantity { get; set; }
    public int ActualQuantity { get; set; }

    [NotMapped]
    public int DeltaQuantity => ActualQuantity - SystemQuantity;
}

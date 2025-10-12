using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.InventoryCheck;

public class CreateInventoryCheckRequest
{
    public DateTime CheckTime { get; set; } = DateTime.UtcNow;

    public string? Note { get; set; }

    public List<CreateInventoryCheckItem> Items { get; set; } = new();
}

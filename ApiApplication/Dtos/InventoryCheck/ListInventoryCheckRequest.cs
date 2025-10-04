using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos.InventoryCheck;

public class ListInventoryCheckRequest
{
    public int? Id { get; set; }
    public string? Code { get; set; }
    public InventoryCheckStatus? Status { get; set; }
} 
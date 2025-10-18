using System;

namespace ApiApplication.Dtos.PriceTable;

public class ListPriceTableResponse
{
    public required int Id { get; set; }
    public required string Name { get; set; }
    public bool IsActive { get; set; }
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
}

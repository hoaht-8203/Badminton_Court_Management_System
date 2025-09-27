using System;
using System.Collections.Generic;

namespace ApiApplication.Dtos;

public class DetailPriceTableResponse
{
    public required int Id { get; set; }
    public required string Name { get; set; }
    public bool IsActive { get; set; }
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public List<PriceTimeRangeDto> TimeRanges { get; set; } = new();
}

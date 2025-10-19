using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.PriceTable;

public class CreatePriceTableRequest
{
    [Required]
    [MaxLength(200)]
    public string? Name { get; set; }

    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }

    public bool IsActive { get; set; } = true;

    public List<PriceTimeRangeDto> TimeRanges { get; set; } = new();
}

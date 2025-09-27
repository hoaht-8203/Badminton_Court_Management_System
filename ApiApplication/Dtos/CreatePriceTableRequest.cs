using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos;

public class CreatePriceTableRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }

    public bool IsActive { get; set; } = true;

    public List<PriceTimeRangeDto> TimeRanges { get; set; } = new();
} 
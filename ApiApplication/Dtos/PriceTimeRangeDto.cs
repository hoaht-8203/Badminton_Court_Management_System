using System;
using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos;

public class PriceTimeRangeDto
{
    public int? Id { get; set; }

    [Required]
    public TimeSpan StartTime { get; set; }

    [Required]
    public TimeSpan EndTime { get; set; }
}

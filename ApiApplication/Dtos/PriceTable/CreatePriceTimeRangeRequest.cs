using System;
using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.PriceTable;

public class CreatePriceTimeRangeRequest
{
    [Required]
    public int PriceTableId { get; set; }

    [Required]
    public TimeSpan StartTime { get; set; }

    [Required]
    public TimeSpan EndTime { get; set; }
}

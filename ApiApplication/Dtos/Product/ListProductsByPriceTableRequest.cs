using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Product;

public class ListProductsByPriceTableRequest
{
    [Required]
    public int PriceTableId { get; set; }

    public string? Search { get; set; }

    public int? CategoryId { get; set; }

    public bool? IsActive { get; set; }
}

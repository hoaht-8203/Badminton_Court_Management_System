using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel;

namespace ApiApplication.Dtos.Product;

public class ListProductsByPriceTableRequest
{
   
    [Required]
    public int PriceTableId { get; set; }
 
    public string? Search { get; set; } 
   
    public int? CategoryId { get; set; }
    
    public bool? IsActive { get; set; }
}

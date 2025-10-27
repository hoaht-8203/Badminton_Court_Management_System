using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Service;

public class CreateServiceRequest
{
    [MaxLength(100)]
    public string? Code { get; set; }

    [Required]
    [MaxLength(255)]
    public required string Name { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Price must be greater than or equal to 0")]
    public required decimal PricePerHour { get; set; }

    [MaxLength(50)]
    public string? Category { get; set; }

    [MaxLength(100)]
    public string? Unit { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Stock quantity must be greater than or equal to 0")]
    public int? StockQuantity { get; set; }

    [MaxLength(1000)]
    public string? Note { get; set; }
}

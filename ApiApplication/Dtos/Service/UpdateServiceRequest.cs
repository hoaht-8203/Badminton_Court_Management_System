using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Service;

public class UpdateServiceRequest
{
    [Required]
    public required Guid Id { get; set; }

    [MaxLength(50)]
    public string? Code { get; set; }

    [MaxLength(255)]
    public string? Name { get; set; }

    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int? LinkedProductId { get; set; }

    public decimal? PricePerHour { get; set; }
}



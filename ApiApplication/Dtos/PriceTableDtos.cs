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

public class UpdatePriceTableRequest : CreatePriceTableRequest
{
    [Required]
    public int Id { get; set; }
}

public class DeletePriceTableRequest
{
    [Required]
    public int Id { get; set; }
}

public class DetailPriceTableRequest
{
    [Required]
    public int Id { get; set; }
}

public class ListPriceTableRequest
{
    public int? Id { get; set; }
    public string? Name { get; set; }
    public bool? IsActive { get; set; }
}

public class ListPriceTableResponse
{
    public required int Id { get; set; }
    public required string Name { get; set; }
    public bool IsActive { get; set; }
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
}

public class DetailPriceTableResponse
{
    public required int Id { get; set; }
    public required string Name { get; set; }
    public bool IsActive { get; set; }
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public List<PriceTimeRangeDto> TimeRanges { get; set; } = new();
}

public class SetPriceTableProductsRequest
{
    [Required]
    public int PriceTableId { get; set; }
    [Required]
    public List<SetPriceTableProductItem> Items { get; set; } = new();
}

public class SetPriceTableProductItem
{
    public required int ProductId { get; set; }
    public decimal? OverrideSalePrice { get; set; }
}

public class ListPriceTableProductsResponse
{
    public int PriceTableId { get; set; }
    public List<PriceTableProductItem> Items { get; set; } = new();
}

public class PriceTableProductItem
{
    public required int ProductId { get; set; }
    public decimal? OverrideSalePrice { get; set; }
} 
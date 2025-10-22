using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class PriceTable : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string? Name { get; set; }

    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }

    public bool IsActive { get; set; } = true;

    public List<PriceTimeRange> TimeRanges { get; set; } = new();

    public List<PriceTableProduct> PriceTableProducts { get; set; } = new();
}

public class PriceTimeRange
{
    [Key]
    public int Id { get; set; }

    public int PriceTableId { get; set; }
    public PriceTable PriceTable { get; set; } = null!;

    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
}

public class PriceTableProduct
{
    public int PriceTableId { get; set; }
    public PriceTable PriceTable { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public decimal? OverrideSalePrice { get; set; }
}

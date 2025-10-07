using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Service : BaseEntity
{
    [Key]
    public required Guid Id { get; set; }

    [MaxLength(50)]
    public string? Code { get; set; }

    [Required]
    [MaxLength(255)]
    public required string Name { get; set; }

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public required string Status { get; set; } = ServiceStatus.Active;

    // Optional: liên kết hàng hóa để kiểm soát tồn kho khi sử dụng dịch vụ (vd thuê vợt)
    public int? LinkedProductId { get; set; }
    public Product? LinkedProduct { get; set; }

    public ICollection<ServicePricingRule> ServicePricingRules { get; set; } = [];
}



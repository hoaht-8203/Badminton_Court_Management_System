using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Service;

public class CreateServiceRequest
{
    [MaxLength(50)]
    public string? Code { get; set; }

    [MaxLength(255)]
    public required string Name { get; set; }

    public string? Description { get; set; }
    public string? ImageUrl { get; set; }

    // Liên kết hàng hóa để (tùy chọn) kiểm soát tồn kho khi dùng dịch vụ
    public int? LinkedProductId { get; set; }

    public required decimal PricePerHour { get; set; }
}

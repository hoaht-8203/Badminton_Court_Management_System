using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Product : BaseEntity, IAuditableEntity
{
    [Key]
    public int Id { get; set; }

    // General information
    [MaxLength(50)]
    public string? Code { get; set; } // Mã hàng hóa (tự động có thể null khi tạo)

    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty; // Tên hàng

    [MaxLength(100)]
    public string? MenuType { get; set; } // Loại thực đơn (Đồ ăn/Đồ uống/Khác)

    // Category relationship
    public int? CategoryId { get; set; } // Foreign key to Category
    public virtual Category? Category { get; set; } // Navigation property

    [MaxLength(150)]
    public string? Position { get; set; } // Vị trí hiển thị

    // Pricing
    public decimal CostPrice { get; set; } // Giá vốn
    public decimal SalePrice { get; set; } // Giá bán

    // Flags
    public bool IsDirectSale { get; set; } = true; // Bán trực tiếp
    public bool IsActive { get; set; } = true; // Trạng thái kinh doanh

    // Inventory management
    public bool ManageInventory { get; set; } = false; // Quản lý tồn kho
    public int Stock { get; set; } = 0; // Tồn kho hiện tại
    public int MinStock { get; set; } = 0; // Ít nhất
    public int MaxStock { get; set; } = 0; // Nhiều nhất

    // Details
    public string? Description { get; set; } // Mô tả chi tiết (rich text)
    public string? NoteTemplate { get; set; } // Mẫu ghi chú (hóa đơn, đặt hàng)

    // Media & attributes
    public string[] Images { get; set; } = Array.Empty<string>(); // Danh sách ảnh

    // Unit
    [MaxLength(50)]
    public string? Unit { get; set; } // Đơn vị tính
}

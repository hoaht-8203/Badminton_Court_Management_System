using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos;

public class UpdateProductRequest
{
    [Required(ErrorMessage = "Id sản phẩm là bắt buộc")]
    public int Id { get; set; }

    [Required(ErrorMessage = "Mã sản phẩm là bắt buộc")]
    [MaxLength(50, ErrorMessage = "Mã sản phẩm không được vượt quá 50 ký tự")]
    public string? Code { get; set; }

    [Required(ErrorMessage = "Tên sản phẩm là bắt buộc")]
    [MaxLength(255, ErrorMessage = "Tên sản phẩm không được vượt quá 255 ký tự")]
    public string? Name { get; set; }

    public int? CategoryId { get; set; }

    [MaxLength(150, ErrorMessage = "Vị trí không được vượt quá 150 ký tự")]
    public string? Position { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Giá vốn phải lớn hơn hoặc bằng 0")]
    public decimal? CostPrice { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Giá bán phải lớn hơn hoặc bằng 0")]
    public decimal? SalePrice { get; set; }

    public bool? IsActive { get; set; }
    public bool? IsDisplayOnWeb { get; set; }

    public bool? ManageInventory { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Tồn kho phải lớn hơn hoặc bằng 0")]
    public int? Stock { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Tồn kho tối thiểu phải lớn hơn hoặc bằng 0")]
    public int? MinStock { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Tồn kho tối đa phải lớn hơn hoặc bằng 0")]
    public int? MaxStock { get; set; }

    public string? Description { get; set; }
    public string? NoteTemplate { get; set; }

    public List<string>? Images { get; set; }

    [MaxLength(50, ErrorMessage = "Đơn vị không được vượt quá 50 ký tự")]
    public string? Unit { get; set; }
}

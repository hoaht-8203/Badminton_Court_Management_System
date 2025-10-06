using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.InventoryCheck;

public class MergeInventoryChecksRequest
{
    [Required(ErrorMessage = "Danh sách ID phiếu kiểm kê không được để trống")]
    [MinLength(2, ErrorMessage = "Phải chọn ít nhất 2 phiếu kiểm kê để gộp")]
    public List<int> InventoryCheckIds { get; set; } = new();
}

using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.ReturnGoods
{
    public class CreateReturnGoodsRequest
    {
        [Required(ErrorMessage = "Thời gian trả hàng là bắt buộc")]
        public DateTime ReturnTime { get; set; }
        
        [Required(ErrorMessage = "Nhà cung cấp là bắt buộc")]
        public int SupplierId { get; set; }
        
        [StringLength(100, ErrorMessage = "Người trả hàng không được vượt quá 100 ký tự")]
        public string? ReturnBy { get; set; }
        
        [StringLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự")]
        public string? Note { get; set; }
        
        [Range(0, double.MaxValue, ErrorMessage = "Giảm giá phải lớn hơn hoặc bằng 0")]
        public decimal Discount { get; set; }
        
        [Range(0, double.MaxValue, ErrorMessage = "Số tiền nhà cung cấp đã trả phải lớn hơn hoặc bằng 0")]
        public decimal SupplierPaid { get; set; }
        
        [Range(0, 1, ErrorMessage = "Phương thức thanh toán phải là 0 (tiền mặt) hoặc 1 (chuyển khoản)")]
        public int PaymentMethod { get; set; } = 0; // 0=cash, 1=transfer
        
        public int? StoreBankAccountId { get; set; }
        
        public bool Complete { get; set; }
        
        [Required(ErrorMessage = "Danh sách sản phẩm là bắt buộc")]
        [MinLength(1, ErrorMessage = "Phiếu trả hàng phải có ít nhất một sản phẩm")]
        public List<CreateReturnGoodsItem> Items { get; set; } = new();
    }
}

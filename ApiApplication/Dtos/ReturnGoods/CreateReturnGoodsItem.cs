using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.ReturnGoods
{
    public class CreateReturnGoodsItem
    {
        [Required(ErrorMessage = "Mã sản phẩm là bắt buộc")]
        public int ProductId { get; set; }
        
        [Required(ErrorMessage = "Số lượng là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
        public int Quantity { get; set; }
        
        [Required(ErrorMessage = "Giá nhập là bắt buộc")]
        [Range(0, double.MaxValue, ErrorMessage = "Giá nhập phải lớn hơn hoặc bằng 0")]
        public decimal ImportPrice { get; set; }
        
        [Required(ErrorMessage = "Giá trả là bắt buộc")]
        [Range(0, double.MaxValue, ErrorMessage = "Giá trả phải lớn hơn hoặc bằng 0")]
        public decimal ReturnPrice { get; set; }
        
        [Range(0, double.MaxValue, ErrorMessage = "Giảm giá phải lớn hơn hoặc bằng 0")]
        public decimal Discount { get; set; }
        
        [StringLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự")]
        public string? Note { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos
{
    public class StaffRequest
    {
        [Required(ErrorMessage = "Họ và tên là bắt buộc")]
        [MaxLength(255, ErrorMessage = "Họ và tên không được vượt quá 255 ký tự")]
        public string FullName { get; set; } = string.Empty;

        [StringLength(12, MinimumLength = 12, ErrorMessage = "Căn cước công dân phải có đúng 12 chữ số")]
        [RegularExpression(@"^\d{12}$", ErrorMessage = "Căn cước công dân phải có đúng 12 chữ số")]
        public string? IdentificationNumber { get; set; }

        public int? DepartmentId { get; set; }

        public int? BranchId { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public DateTime? DateOfJoining { get; set; }

        [MaxLength(500, ErrorMessage = "Địa chỉ không được vượt quá 500 ký tự")]
        public string? Address { get; set; }

        [StringLength(11, MinimumLength = 9, ErrorMessage = "Số điện thoại phải có từ 9 đến 11 chữ số")]
        [RegularExpression(@"^\d{9,11}$", ErrorMessage = "Số điện thoại phải có từ 9 đến 11 chữ số")]
        public string? PhoneNumber { get; set; }

        [MaxLength(500, ErrorMessage = "Đường dẫn avatar không được vượt quá 500 ký tự")]
        public string? AvatarUrl { get; set; }

        public bool IsActive { get; set; } = true;

        [Required(ErrorMessage = "Cài đặt lương là bắt buộc")]
        [MaxLength(2000, ErrorMessage = "Cài đặt lương không được vượt quá 2000 ký tự")]
        public string SalarySettings { get; set; } = "{}";

        public string? AccountId { get; set; }
    }
}

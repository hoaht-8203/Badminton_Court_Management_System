using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities
{
    public class Staff : BaseEntity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string FullName { get; set; } = string.Empty;

        public int? DepartmentId { get; set; }

        [ForeignKey(nameof(DepartmentId))]
        public Department? Department { get; set; }

        [StringLength(12, MinimumLength = 12)]
        [RegularExpression(@"^\d{12}$", ErrorMessage = "Căn cước công dân phải có đúng 12 chữ số")]
        public string? IdentificationNumber { get; set; }

        public int? BranchId { get; set; }

        [ForeignKey(nameof(BranchId))]
        public Branch? Branch { get; set; }

        public DateOnly? DateOfBirth { get; set; }

        public DateOnly? DateOfJoining { get; set; }

        [MaxLength(500)]
        public string? Address { get; set; }

        [StringLength(11, MinimumLength = 9)]
        [RegularExpression(@"^\d{9,11}$", ErrorMessage = "Số điện thoại phải có từ 9 đến 11 chữ số")]
        public string? PhoneNumber { get; set; }

        [MaxLength(500)]
        public string? AvatarUrl { get; set; }

        public bool IsActive { get; set; } = true;

        [MaxLength(1000)]
        public string? Note { get; set; }

        // Link to ApplicationUser
        public Guid? UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public ApplicationUser? User { get; set; }

        [Required]
        [MaxLength(2000)]
        public string SalarySettings { get; set; } = "{}";
    }
}

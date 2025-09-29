using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities
{
    public class Staff : BaseEntity
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public int? DepartmentId { get; set; }
        public string? IdentificationNumber { get; set; }
        public Department? Department { get; set; }
        public int? BranchId { get; set; }
        public Branch? Branch { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public DateOnly? DateOfJoining { get; set; }
        public string? Address { get; set; }
        public string? PhoneNumber { get; set; }
        public string? AvatarUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public string? Note { get; set; }

        // Link to ApplicationUser
        public Guid? UserId { get; set; }
        public ApplicationUser? User { get; set; }

        public string SalarySettings { get; set; } = "{}";
    }
}

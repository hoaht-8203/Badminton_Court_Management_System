namespace ApiApplication.Dtos
{
    public class StaffRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string? IdentificationNumber { get; set; }
        public int? DepartmentId { get; set; }
        public int? BranchId { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public DateTime? DateOfJoining { get; set; }
        public string? Address { get; set; }
        public string? PhoneNumber { get; set; }
        public string? AvatarUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public string SalarySettings { get; set; } = "{}";
        public string? AccountId { get; set; }
    }
}

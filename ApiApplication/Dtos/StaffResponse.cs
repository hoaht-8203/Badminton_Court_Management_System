namespace ApiApplication.Dtos;

public class StaffResponse
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? IdentificationNumber { get; set; }

    // public DepartmentResponse? Department { get; set; }
    // public BranchResponse? Branch { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public DateTime? DateOfJoining { get; set; }
    public string? Address { get; set; }
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public string SalarySettings { get; set; } = "{}";
}

public class StaffAttendanceResponse : StaffResponse
{
    public string? AttendanceStatus { get; set; }
}

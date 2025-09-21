namespace ApiApplication.Dtos
{
    public class StaffResponse
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? AvatarUrl { get; set; }
        public string SalarySettings { get; set; } = "{}";
    }
}
namespace ApiApplication.Dtos.Dashboard;

public class TopCourtDto
{
    public System.Guid CourtId { get; set; }
    public string CourtName { get; set; } = string.Empty;
    public int BookingCount { get; set; }
}

namespace ApiApplication.Dtos.Dashboard;

public class HeatmapCellDto
{
    // DayOfWeek 0 = Sunday .. 6 = Saturday
    public int DayOfWeek { get; set; }
    public int Hour { get; set; }
    public int Bookings { get; set; }
}

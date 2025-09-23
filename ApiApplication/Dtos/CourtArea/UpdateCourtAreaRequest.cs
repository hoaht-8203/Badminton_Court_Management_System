using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.CourtArea;

public class UpdateCourtAreaRequest
{
    public required int Id { get; set; }
    public required string Name { get; set; }
}

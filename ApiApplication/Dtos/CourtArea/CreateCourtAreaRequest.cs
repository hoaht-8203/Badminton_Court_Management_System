using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.CourtArea;

public class CreateCourtAreaRequest
{
    public required string Name { get; set; }
}

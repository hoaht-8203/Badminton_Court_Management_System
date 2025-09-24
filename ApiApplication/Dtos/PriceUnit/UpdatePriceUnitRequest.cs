using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.PriceUnit;

public class UpdatePriceUnitRequest
{
    public required int Id { get; set; }
    public required string Name { get; set; }
}

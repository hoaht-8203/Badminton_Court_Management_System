using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.PriceUnit;

public class CreatePriceUnitRequest
{
    public required string Name { get; set; }
}

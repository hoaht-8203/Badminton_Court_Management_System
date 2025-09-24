using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.PriceUnit;

public class DeletePriceUnitRequest
{
    public required int Id { get; set; }
}

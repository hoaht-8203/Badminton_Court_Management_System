using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Service;

public class DetailServiceRequest
{
    public required Guid Id { get; set; }
}

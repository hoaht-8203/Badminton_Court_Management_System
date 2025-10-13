using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos.Service;

public class ChangeServiceStatusRequest
{
    public required Guid Id { get; set; }

    public required string Status { get; set; }

    public bool IsValidStatus()
    {
        return ServiceStatus.ValidStatuses.Contains(Status);
    }
}

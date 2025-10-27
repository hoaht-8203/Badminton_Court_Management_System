using System.ComponentModel.DataAnnotations;
using ApiApplication.Constants;

namespace ApiApplication.Dtos.Service;

public class ChangeServiceStatusRequest
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Status { get; set; }

    public bool IsValidStatus()
    {
        return Status == ServiceStatus.Active
            || Status == ServiceStatus.Inactive
            || Status == ServiceStatus.Deleted;
    }
}

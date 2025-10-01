using System;

namespace ApiApplication.Dtos;

public class ChangeStaffStatusRequest
{
    public required int StaffId { get; set; }
    public required bool IsActive { get; set; }
}

using System;

namespace ApiApplication.Dtos.Membership;

public class UpdateMemberShipStatusRequest
{
    public int Id { get; set; }
    public required string Status { get; set; }
}

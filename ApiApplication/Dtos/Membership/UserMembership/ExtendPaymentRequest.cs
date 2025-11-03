using System;

namespace ApiApplication.Dtos.Membership.UserMembership;

public class ExtendPaymentRequest
{
    public int UserMembershipId { get; set; }
    public string? Note { get; set; }
}

using System;

namespace ApiApplication.Dtos.Voucher;

public class VoucherUserRuleDto
{
    public bool? IsNewCustomer { get; set; }
    public int? MembershipId { get; set; }
    public List<int>? SpecificCustomerIds { get; set; }
}

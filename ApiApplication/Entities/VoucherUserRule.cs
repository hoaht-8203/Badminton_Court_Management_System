using System;

namespace ApiApplication.Entities;

public class VoucherUserRule
{
    public int Id { get; set; }
    public int VoucherId { get; set; }
    public Voucher Voucher { get; set; } = null!;
    public bool? IsNewCustomer { get; set; }
    public int? MembershipId { get; set; }
    public Membership? Membership { get; set; }
    public List<int>? SpecificCustomerIds { get; set; }
}

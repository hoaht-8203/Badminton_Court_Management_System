using System;

namespace ApiApplication.Dtos.Voucher;

public class VoucherUserRuleDto
{
    public string? UserType { get; set; }
    public bool? IsNewCustomer { get; set; }
}

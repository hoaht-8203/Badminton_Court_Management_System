using System;

namespace ApiApplication.Entities;

public class VoucherUserRule
{
    public int Id { get; set; }
    public int VoucherId { get; set; }
    public Voucher Voucher { get; set; } = null!;
    public string? UserType { get; set; } = null!; // e.g., "new_customer", "loyal_customer", etc.
    public bool? IsNewCustomer { get; set; }
}

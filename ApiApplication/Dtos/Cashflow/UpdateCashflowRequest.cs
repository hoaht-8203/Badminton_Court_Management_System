using System.ComponentModel.DataAnnotations;
using ApiApplication.Enums;

namespace ApiApplication.Dtos.Cashflow;

public class UpdateCashflowRequest
{
    [Required]
    public int CashflowTypeId { get; set; }

    [Required]
    public decimal Value { get; set; }
    public bool IsPayment { get; set; }

    public DateTime? Time { get; set; }

    public string? RelatedId { get; set; }
    public string? PersonType { get; set; }
    public string? RelatedPerson { get; set; }
    public string? Note { get; set; }

    // public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    // public bool AccountInBusinessResults { get; set; } = true;
    public string? Status { get; set; }
}

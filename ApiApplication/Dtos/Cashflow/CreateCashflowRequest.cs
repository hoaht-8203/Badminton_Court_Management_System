using System.ComponentModel.DataAnnotations;
using ApiApplication.Enums;

namespace ApiApplication.Dtos.Cashflow;

public class CreateCashflowRequest
{
    [Required]
    public int CashflowTypeId { get; set; }

    [Required]
    public decimal Value { get; set; }
    public bool IsPayment { get; set; }

    public int? RelatedId { get; set; }
    public string? PersonType { get; set; }
    public string? RelatedPerson { get; set; }
    public string? Note { get; set; }

    // public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;

    // public bool AccountInBusinessResults { get; set; } = true;

    public DateTime? Time { get; set; }
}

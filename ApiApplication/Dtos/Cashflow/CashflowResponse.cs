using ApiApplication.Enums;

namespace ApiApplication.Dtos.Cashflow;

public class CashflowResponse
{
    public int Id { get; set; }
    public DateTime Time { get; set; }
    public bool IsPayment { get; set; }
    public int CashflowTypeId { get; set; }
    public string CashflowTypeName { get; set; } = string.Empty;
    public string? RelatedId { get; set; }
    public string? PersonType { get; set; }
    public string? RelatedPerson { get; set; }
    public decimal Value { get; set; }

    // public PaymentMethod PaymentMethod { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
    public string? ReferenceNumber { get; set; }

    // public bool AccountInBusinessResults { get; set; }
    public DateTime CreatedAt { get; set; }

    public string? CreatedBy { get; set; }
}

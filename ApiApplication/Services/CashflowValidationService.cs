using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Enums;

namespace ApiApplication.Services;

public class CashflowValidationService
{
   
    public static bool ValidatePaymentTypeConsistency(Cashflow cashflow)
    {
        if (cashflow.CashflowType is null)
        {
            // Navigation not available; cannot verify here
            return true;
        }
        return cashflow.IsPayment == cashflow.CashflowType.IsPayment;
    }


    public static void NormalizeValue(Cashflow cashflow)
    {
        if (cashflow.IsPayment && cashflow.Value > 0)
        {
            cashflow.Value = -cashflow.Value; // Make payment values negative
        }
        else if (!cashflow.IsPayment && cashflow.Value < 0)
        {
            cashflow.Value = Math.Abs(cashflow.Value); // Make receipt values positive
        }
    }

    
    public static (bool IsValid, string? ErrorMessage) ValidateAndNormalize(Cashflow cashflow)
    {
        // 1) Check IsPayment consistency (when possible)
        if (!ValidatePaymentTypeConsistency(cashflow))
        {
            return (false, "IsPayment does not match CashflowType.IsPayment");
        }

        // 2) Validate value before normalization
        if (cashflow.Value == 0)
        {
            return (false, "Value must be non-zero");
        }

        // 3) Normalize sign based on IsPayment
        NormalizeValue(cashflow);

        // 4) Validate status is one of allowed values
        if (string.IsNullOrWhiteSpace(cashflow.Status))
        {
            cashflow.Status = CashFlowStatus.Pending;
        }
        else if (Array.IndexOf(CashFlowStatus.ValidCashFlowStatus, cashflow.Status) < 0)
        {
            return (false, "Invalid status value");
        }

        // 5) Ensure payment method is a defined enum value
        if (!Enum.IsDefined(typeof(PaymentMethod), cashflow.PaymentMethod))
        {
            return (false, "Invalid payment method");
        }

        return (true, null);
    }

    public static Cashflow CreateCashflow(
        bool isPayment,
        CashflowType cashflowType,
        decimal value,
        int? relatedPersonId = null,
        string? note = null,
        Enums.PaymentMethod paymentMethod = Enums.PaymentMethod.Cash)
    {
        var cashflow = new Cashflow
        {
            IsPayment = isPayment,
            CashflowTypeId = cashflowType.Id,
            CashflowType = cashflowType,
            Value = value,
            Note = note,
            PaymentMethod = paymentMethod,
            Status = CashFlowStatus.Pending,
            Time = DateTime.UtcNow
        };

        // Validate and normalize
        var (isValid, errorMessage) = ValidateAndNormalize(cashflow);
        if (!isValid)
        {
            throw new InvalidOperationException($"Invalid cashflow: {errorMessage}");
        }

        return cashflow;
    }
}


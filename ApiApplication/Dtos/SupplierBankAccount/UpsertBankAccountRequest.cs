using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.SupplierBankAccount;

public class UpsertBankAccountRequest
{
    [Required]
    public int SupplierId { get; set; }
    [Required]
    [MaxLength(50)]
    public string AccountNumber { get; set; } = string.Empty;
    [Required]
    [MaxLength(100)]
    public string AccountName { get; set; } = string.Empty;
    [Required]
    [MaxLength(120)]
    public string BankName { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}



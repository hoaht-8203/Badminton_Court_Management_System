using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.StoreBankAccount
{
    public class CreateStoreBankAccountRequest
    {
        [Required]
        [MaxLength(50)]
        public string AccountNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string AccountName { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string BankName { get; set; } = string.Empty;
    }
}



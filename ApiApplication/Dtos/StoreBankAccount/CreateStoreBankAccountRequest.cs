using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.StoreBankAccount
{
    public class CreateStoreBankAccountRequest
    {
        [Required]
        [MaxLength(50)]
        public string? AccountNumber { get; set; }

        [Required]
        [MaxLength(150)]
        public string? AccountName { get; set; }

        [Required]
        [MaxLength(200)]
        public string? BankName { get; set; }
    }
}

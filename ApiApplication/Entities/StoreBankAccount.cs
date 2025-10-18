using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities
{
    public class StoreBankAccount : BaseEntity
    {
        [Key]
        public int Id { get; set; }

        [MaxLength(200)]
        [Required]
        public required string BankName { get; set; }

        [MaxLength(50)]
        [Required]
        public required string AccountNumber { get; set; }

        [MaxLength(150)]
        [Required]
        public required string AccountName { get; set; } 

        public bool IsDefault { get; set; } = false;
    }
}

using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities
{
    public class StoreBankAccount : BaseEntity, IAuditableEntity
    {
        [Key]
        public int Id { get; set; }

        [MaxLength(200)]
        [Required]
        public string BankName { get; set; } = string.Empty;

        [MaxLength(50)]
        [Required]
        public string AccountNumber { get; set; } = string.Empty;

        [MaxLength(150)]
        [Required]
        public string AccountName { get; set; } = string.Empty;

        public bool IsDefault { get; set; } = false;
    }
}

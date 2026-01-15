using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Entities
{
    [Index(nameof(Timestamp), IsDescending = new[] { true })]
    [Index(nameof(TableName), nameof(Action))]
    [Index(nameof(TableName), nameof(EntityId))]
    [Index(nameof(UserId), nameof(Timestamp), IsDescending = new[] { false, true })]
    [Index(nameof(Action))]
    [Index(nameof(EntityId))]
    [Index(nameof(TableName))]
    [Index(nameof(UserId))]
    [Index(nameof(CreatedAt), IsDescending = new[] { true })]
    public class AuditLog
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [StringLength(100)]
        public string TableName { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Action { get; set; } = string.Empty; // Create, Update, Delete

        [Required]
        [StringLength(50)]
        public string EntityId { get; set; } = string.Empty;

        [Column(TypeName = "text")]
        public string? OldValues { get; set; }

        [Column(TypeName = "text")]
        public string? NewValues { get; set; }

        [StringLength(1000)]
        public string? ChangedColumns { get; set; }

        [StringLength(50)]
        public string? UserId { get; set; }

        [StringLength(100)]
        public string? UserName { get; set; }

        [StringLength(45)]
        public string? IpAddress { get; set; }

        [StringLength(500)]
        public string? UserAgent { get; set; }

        [Required]
        public DateTime Timestamp { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public string? CreatedBy { get; set; }

        public string? UpdatedBy { get; set; }
    }
}

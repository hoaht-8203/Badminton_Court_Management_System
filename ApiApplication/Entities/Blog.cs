using System;
using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Blog : BaseEntity
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Title { get; set; }
    public required string Content { get; set; }
    public required string ImageUrl { get; set; }

    public required string Status { get; set; } = BlogStatus.Active;
}

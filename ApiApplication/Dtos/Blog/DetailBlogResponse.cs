using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos.Blog;

public class DetailBlogResponse : BaseEntity
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

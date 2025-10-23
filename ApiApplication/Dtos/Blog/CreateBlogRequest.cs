using System;

namespace ApiApplication.Dtos.Blog;

public class CreateBlogRequest
{
    public required string Title { get; set; }
    public required string Content { get; set; }
    public required string ImageUrl { get; set; }
}

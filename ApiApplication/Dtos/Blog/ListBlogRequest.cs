using System;

namespace ApiApplication.Dtos.Blog;

public class ListBlogRequest
{
    public string? Title { get; set; }
    public string? Status { get; set; }
}

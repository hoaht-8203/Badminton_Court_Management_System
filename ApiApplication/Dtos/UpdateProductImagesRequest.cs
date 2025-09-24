using Microsoft.AspNetCore.Http;

namespace ApiApplication.Dtos;

public class UpdateProductImagesRequest
{
    public int Id { get; set; }
    public required List<IFormFile> Files { get; set; }
    public CancellationToken Ct { get; set; } = default;
} 
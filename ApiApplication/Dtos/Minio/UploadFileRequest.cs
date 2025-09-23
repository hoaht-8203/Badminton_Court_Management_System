using Microsoft.AspNetCore.Http;

namespace ApiApplication.Dtos.Minio;

public class UploadFileRequest
{
    public IFormFile File { get; set; } = default!;
    public CancellationToken Ct { get; set; } = default!;
}

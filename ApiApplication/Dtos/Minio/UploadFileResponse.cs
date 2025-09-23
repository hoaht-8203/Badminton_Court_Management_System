using System;

namespace ApiApplication.Dtos.Minio;

public class UploadFileResponse
{
    public required string PublicUrl { get; set; }
    public required string FileName { get; set; }
}

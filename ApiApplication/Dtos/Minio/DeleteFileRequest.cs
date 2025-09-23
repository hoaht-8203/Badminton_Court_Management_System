using System;

namespace ApiApplication.Dtos.Minio;

public class DeleteFileRequest
{
    public required string FileName { get; set; }
    public CancellationToken Ct { get; set; } = default!;
}

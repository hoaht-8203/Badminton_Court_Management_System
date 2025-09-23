using ApiApplication.Dtos.Minio;
using Microsoft.AspNetCore.Http;
using static ApiApplication.Controllers.FilesController;

namespace ApiApplication.Services;

public interface IStorageService
{
    Task<UploadFileResponse> UploadFileAsync(UploadFileRequest request);
    Task DeleteFileAsync(DeleteFileRequest request);
    string GetPublicUrl(string fileName);
    Task<bool> FileExistsAsync(string fileName, CancellationToken ct = default);
    Task SetBucketPublicPolicyAsync(CancellationToken ct = default);
}

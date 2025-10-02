using System.Net;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Minio;
using ApiApplication.Exceptions;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[ApiController]
[Route("api/files")]
[Authorize]
public class FilesController(IStorageService storageService) : ControllerBase
{
    private readonly IStorageService _storageService = storageService;

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(3145728)] // 3 MB
    public async Task<ActionResult<ApiResponse<UploadFileResponse>>> UploadFile(
        [FromForm] UploadFileRequest request
    )
    {
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var fileExtension = Path.GetExtension(request.File.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(fileExtension))
        {
            throw new ApiException("Chỉ hỗ trợ file ảnh", HttpStatusCode.BadRequest);
        }

        try
        {
            var response = await _storageService.UploadFileAsync(request);
            return Ok(
                ApiResponse<UploadFileResponse>.SuccessResponse(response, "Tải lên file thành công")
            );
        }
        catch (Exception ex)
        {
            throw new ApiException(
                $"Tải lên file thất bại: {ex.Message}",
                HttpStatusCode.InternalServerError
            );
        }
    }

    [HttpDelete("delete")]
    public async Task<ActionResult<ApiResponse<object?>>> DeleteFile(
        [FromQuery] DeleteFileRequest request
    )
    {
        try
        {
            if (!await _storageService.FileExistsAsync(request.FileName, request.Ct))
            {
                throw new ApiException("File không tồn tại", HttpStatusCode.BadRequest);
            }

            await _storageService.DeleteFileAsync(request);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Xóa file thành công"));
        }
        catch (Exception ex)
        {
            throw new ApiException(
                $"Xóa file thất bại: {ex.Message}",
                HttpStatusCode.InternalServerError
            );
        }
    }

    [HttpPost("set-bucket-public")]
    public async Task<IActionResult> SetBucketPublic(CancellationToken ct = default)
    {
        try
        {
            await _storageService.SetBucketPublicPolicyAsync(ct);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Cấu hình bucket thành công"));
        }
        catch (Exception ex)
        {
            return Ok(
                ApiResponse<object?>.ErrorResponse($"Cấu hình bucket thất bại: {ex.Message}")
            );
        }
    }
}

using ApiApplication.Dtos.Minio;
using ApiApplication.Options;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;

namespace ApiApplication.Services.Impl;

public class MinioStorageService : IStorageService
{
    private readonly IMinioClient _client;
    private readonly MinioOptions _options;
    private readonly string _bucketName;

    public MinioStorageService(IMinioClient client, IOptions<MinioOptions> options)
    {
        _client = client;
        _options = options.Value;
        _bucketName = _options.DefaultBucket;
    }

    public async Task<UploadFileResponse> UploadFileAsync(UploadFileRequest request)
    {
        // Ensure bucket exists and has public policy
        await EnsureBucketExistsAsync(request.Ct);
        await SetBucketPublicPolicyAsync(request.Ct);

        // Generate unique filename with folder structure
        var fileName = GenerateFileName(request.File.FileName);

        // Upload file
        await using var stream = request.File.OpenReadStream();
        var putArgs = new PutObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(fileName)
            .WithStreamData(stream)
            .WithObjectSize(stream.Length)
            .WithContentType(request.File.ContentType);

        await _client.PutObjectAsync(putArgs, request.Ct);

        // Return public URL
        return new UploadFileResponse { PublicUrl = GetPublicUrl(fileName), FileName = fileName };
    }

    public async Task DeleteFileAsync(DeleteFileRequest request)
    {
        var removeArgs = new RemoveObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(request.FileName);

        await _client.RemoveObjectAsync(removeArgs, request.Ct);
    }

    public async Task<bool> FileExistsAsync(string fileName, CancellationToken ct = default)
    {
        try
        {
            var statArgs = new StatObjectArgs().WithBucket(_bucketName).WithObject(fileName);

            await _client.StatObjectAsync(statArgs, ct);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public string GetPublicUrl(string fileName)
    {
        if (string.IsNullOrWhiteSpace(_options.PublicBaseUrl))
        {
            throw new InvalidOperationException("PublicBaseUrl is not configured");
        }

        return $"{_options.PublicBaseUrl.TrimEnd('/')}/{_bucketName}/{fileName}";
    }

    private async Task EnsureBucketExistsAsync(CancellationToken ct)
    {
        var bucketExistsArgs = new BucketExistsArgs().WithBucket(_bucketName);
        var exists = await _client.BucketExistsAsync(bucketExistsArgs, ct);

        if (!exists)
        {
            var makeBucketArgs = new MakeBucketArgs().WithBucket(_bucketName);
            await _client.MakeBucketAsync(makeBucketArgs, ct);

            // Set bucket policy for public read access
            await SetBucketPublicPolicyAsync(ct);
        }
    }

    public async Task SetBucketPublicPolicyAsync(CancellationToken ct = default)
    {
        var policy =
            $@"{{
            ""Version"": ""2012-10-17"",
            ""Statement"": [
                {{
                    ""Effect"": ""Allow"",
                    ""Principal"": {{
                        ""AWS"": [""*""]
                    }},
                    ""Action"": [""s3:GetObject""],
                    ""Resource"": [""arn:aws:s3:::{_bucketName}/*""]
                }}
            ]
        }}";

        var setPolicyArgs = new SetPolicyArgs().WithBucket(_bucketName).WithPolicy(policy);

        await _client.SetPolicyAsync(setPolicyArgs, ct);
    }

    private static string GenerateFileName(string originalFileName, string? folder = null)
    {
        var extension = Path.GetExtension(originalFileName);
        var uniqueId = Guid.NewGuid().ToString("N");
        var fileName = $"{uniqueId}{extension}";
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");

        if (!string.IsNullOrWhiteSpace(folder))
        {
            return $"{folder.Trim('/')}/{fileName}";
        }

        return $"{timestamp}-{fileName}";
    }
}

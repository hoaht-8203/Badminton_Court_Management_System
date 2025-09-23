namespace ApiApplication.Options;

public class MinioOptions
{
    public const string MinioOptionsKey = "Minio";

    public string Endpoint { get; set; } = string.Empty; // minio.caulong365.store
    public int Port { get; set; } = 9001; // service endpoint
    public bool UseSSL { get; set; } = true;
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string DefaultBucket { get; set; } = "bcms";
    public string PublicBaseUrl { get; set; } = string.Empty; // https://minio.caulong365.store
}

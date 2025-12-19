namespace FaceRecognation.Services
{
    /// <summary>
    /// Singleton store for access token shared across all services
    /// </summary>
    public class TokenStore
    {
        public string? AccessToken { get; set; }
    }
}

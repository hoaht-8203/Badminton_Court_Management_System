using System.Threading.Tasks;

namespace FaceRecognation.Services.Interfaces
{
    public interface IAuthService
    {
        /// <summary>
        /// Perform login against /api/auth/login. Returns (Success, RawData, Message).
        /// RawData contains the server "data" JSON if present.
        /// </summary>
        Task<(bool Success, string? RawData, string? Message)> LoginAsync(
            string email,
            string password
        );

        /// <summary>
        /// Optional logout endpoint call. Not required for initial implementation.
        /// </summary>
        Task LogoutAsync();

        /// <summary>
        /// Raw JSON of the current user response returned by server after successful login (if any).
        /// </summary>
        string? CurrentUserJson { get; }
    }
}

using System.Threading.Tasks;

namespace FaceRecognation.Services.Interfaces
{
    public interface IAuthService
    {
        /// <summary>
        /// Perform login against /api/auth/login. Returns the server ApiResponse<CurrentUserResponse>.
        /// </summary>
        Task<Dtos.ApiResponse<Dtos.CurrentUserResponse>> LoginAsync(string email, string password);

        /// <summary>
        /// Optional logout endpoint call. Not required for initial implementation.
        /// </summary>
        Task LogoutAsync();

        /// <summary>
        /// Check whether the current user JSON (if present) contains the specified role.
        /// Returns false when no current user is set or parsing fails.
        /// </summary>
        bool HasRole(string role);
    }
}

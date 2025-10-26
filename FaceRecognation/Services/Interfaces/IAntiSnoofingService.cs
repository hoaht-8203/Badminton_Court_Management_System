using System.Threading.Tasks;

namespace FaceRecognation.Services.Interfaces
{
    /// <summary>
    /// Abstraction for anti-spoofing / liveness checks.
    /// Implementations should verify whether the provided image bytes
    /// come from a live person (not a spoof/print/photo).
    /// </summary>
    public interface IAntiSnoofingService
    {
        /// <summary>
        /// Check liveness for the provided image bytes.
        /// </summary>
        /// <param name="imageBytes">Image encoded as bytes (PNG/JPEG)</param>
        /// <returns>True when the image is considered real/live; otherwise false.</returns>
        Task<bool> CheckLivenessAsync(byte[] imageBytes);
    }
}

using System.Threading.Tasks;

namespace FaceRecognation.Services.Interfaces
{
    /// <summary>
    /// Abstraction for communicating with the CompreFace recognition API.
    /// Implementations should send an image and return the raw JSON response
    /// from the CompreFace service.
    /// </summary>
    public interface ICompreFaceService
    {
        /// <summary>
        /// Send image bytes to the recognition API and return the raw JSON response.
        /// </summary>
        /// <param name="imageBytes">Image encoded as bytes (PNG/JPEG)</param>
        /// <returns>Raw JSON response from CompreFace as string</returns>
        Task<string> RecognizeAsync(byte[] imageBytes);

        /// <summary>
        /// Verify that the supplied image matches the given subject name.
        /// Implementation typically calls the recognition endpoint and checks
        /// whether any returned subject matches the name with similarity >= threshold.
        /// </summary>
        Task<bool> VerifySubjectAsync(
            byte[] imageBytes,
            string subjectName,
            double similarityThreshold = 0.8
        );

        /// <summary>
        /// Create a subject with the supplied name. Returns raw JSON response.
        /// </summary>
        Task<string> CreateSubjectAsync(string subjectName);

        /// <summary>
        /// Delete a subject by name. Returns raw JSON response.
        /// </summary>
        Task<string> DeleteSubjectAsync(string subjectName);

        /// <summary>
        /// Upload an image for a subject (associate face with subject).
        /// Returns raw JSON response.
        /// </summary>
        Task<string> AddFaceToSubjectAsync(string subjectName, byte[] imageBytes);

        /// <summary>
        /// Get a single subject by name. Returns raw JSON response.
        /// </summary>
        Task<string> GetSubjectAsync(string subjectName);

        /// <summary>
        /// List subjects (raw JSON). Optional pagination.
        /// </summary>
        Task<string> ListSubjectsAsync(int limit = 100, int offset = 0);
    }
}

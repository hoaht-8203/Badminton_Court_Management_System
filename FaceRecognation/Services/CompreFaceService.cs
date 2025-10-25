using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FaceRecognation.Services.Interfaces;

namespace FaceRecognation.Services
{
    /// <summary>
    /// CompreFace client implementation that posts an image with the
    /// same form data used by the original MainWindow logic and returns
    /// the raw JSON response.
    /// </summary>
    public class CompreFaceService : ICompreFaceService
    {
        private readonly HttpClient _httpClient;

        public CompreFaceService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<string> RecognizeAsync(byte[] imageBytes)
        {
            using var content = new MultipartFormDataContent();
            var imageContent = new ByteArrayContent(imageBytes);
            imageContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");

            // Mirror MainWindow: field name "file" and include the same extra fields
            content.Add(imageContent, "file", "face.jpg");
            content.Add(new StringContent("0.81"), "det_prob_threshold");
            content.Add(
                new StringContent("landmarks,gender,age,detector,calculator"),
                "face_plugins"
            );
            content.Add(new StringContent("1"), "prediction_count");
            content.Add(new StringContent("true"), "status");

            // Use the same endpoint MainWindow used
            var response = await _httpClient.PostAsync("/api/v1/recognition/recognize", content);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<bool> VerifySubjectAsync(
            byte[] imageBytes,
            string subjectName,
            double similarityThreshold = 0.8
        )
        {
            var json = await RecognizeAsync(imageBytes);
            try
            {
                using var doc = JsonDocument.Parse(json);
                // Try to find subjects in the usual places: result[0].subjects or root.result
                if (
                    doc.RootElement.TryGetProperty("result", out var result)
                    && result.ValueKind == JsonValueKind.Array
                )
                {
                    foreach (var r in result.EnumerateArray())
                    {
                        if (
                            r.TryGetProperty("subjects", out var subjects)
                            && subjects.ValueKind == JsonValueKind.Array
                        )
                        {
                            foreach (var s in subjects.EnumerateArray())
                            {
                                if (
                                    s.TryGetProperty("subject", out var name)
                                    && name.GetString() == subjectName
                                    && s.TryGetProperty("similarity", out var sim)
                                    && sim.GetDouble() >= similarityThreshold
                                )
                                {
                                    return true;
                                }
                            }
                        }
                    }
                }

                // Fallback: look for subjects at root
                if (
                    doc.RootElement.TryGetProperty("subjects", out var rootSubjects)
                    && rootSubjects.ValueKind == JsonValueKind.Array
                )
                {
                    foreach (var s in rootSubjects.EnumerateArray())
                    {
                        if (
                            s.TryGetProperty("subject", out var name)
                            && name.GetString() == subjectName
                            && s.TryGetProperty("similarity", out var sim)
                            && sim.GetDouble() >= similarityThreshold
                        )
                        {
                            return true;
                        }
                    }
                }
            }
            catch
            {
                // ignore parse errors and treat as non-match
            }

            return false;
        }

        public async Task<string> CreateSubjectAsync(string subjectName)
        {
            var payload = JsonSerializer.Serialize(new { subject = subjectName });
            using var content = new StringContent(payload, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("/api/v1/subject", content);
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> DeleteSubjectAsync(string subjectName)
        {
            var response = await _httpClient.DeleteAsync(
                $"/api/v1/subject/{Uri.EscapeDataString(subjectName)}"
            );
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> AddFaceToSubjectAsync(string subjectName, byte[] imageBytes)
        {
            using var content = new MultipartFormDataContent();
            var imageContent = new ByteArrayContent(imageBytes);
            imageContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
            content.Add(imageContent, "file", "face.jpg");

            var response = await _httpClient.PostAsync(
                $"/api/v1/subject/{Uri.EscapeDataString(subjectName)}/face",
                content
            );
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetSubjectAsync(string subjectName)
        {
            var response = await _httpClient.GetAsync(
                $"/api/v1/subject/{Uri.EscapeDataString(subjectName)}"
            );
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> ListSubjectsAsync(int limit = 100, int offset = 0)
        {
            var response = await _httpClient.GetAsync(
                $"/api/v1/subject?limit={limit}&offset={offset}"
            );
            return await response.Content.ReadAsStringAsync();
        }
    }
}

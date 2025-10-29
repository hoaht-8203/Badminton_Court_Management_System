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
            var body = await response.Content.ReadAsStringAsync();
            if (response.IsSuccessStatusCode)
            {
                return body;
            }

            // Provide the response body for easier debugging (CompreFace returns JSON errors)
            throw new HttpRequestException(
                $"CompreFace Recognize failed ({(int)response.StatusCode}) {body}"
            );
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
            var body = await response.Content.ReadAsStringAsync();
            if (response.IsSuccessStatusCode)
            {
                return body;
            }

            // Fallback: try alternate endpoint used by some CompreFace versions
            var altContent = new StringContent(payload, Encoding.UTF8, "application/json");
            var altResponse = await _httpClient.PostAsync(
                "/api/v1/recognition/subjects",
                altContent
            );
            var altBody = await altResponse.Content.ReadAsStringAsync();
            if (altResponse.IsSuccessStatusCode)
            {
                return altBody;
            }

            // Both attempts failed, throw with both bodies for debugging
            throw new HttpRequestException(
                $"CompreFace CreateSubject failed (/api/v1/subject: {(int)response.StatusCode}) {body} ; (/api/v1/recognition/subjects: {(int)altResponse.StatusCode}) {altBody}"
            );
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
            // Try the endpoint used by your Postman screenshot first:
            // POST /api/v1/recognition/faces?subject={subject}
            // Form-data: file (binary)

            async Task<(bool ok, HttpResponseMessage resp, string body)> TryPost(
                string url,
                string fieldName
            )
            {
                using var multipart = new MultipartFormDataContent();
                var imageContent = new ByteArrayContent(imageBytes);
                imageContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
                multipart.Add(imageContent, fieldName, "face.jpg");
                var resp = await _httpClient.PostAsync(url, multipart);
                var body = await resp.Content.ReadAsStringAsync();
                return (resp.IsSuccessStatusCode, resp, body);
            }

            var attempted = new System.Collections.Generic.List<string>();
            var escaped = Uri.EscapeDataString(subjectName);

            var candidates = new System.Collections.Generic.List<string>
            {
                $"/api/v1/recognition/faces?subject={escaped}",
                $"/api/v1/subject/{escaped}/face",
                $"/api/v1/recognition/subjects/{escaped}/faces",
            };

            // If the server returns a numeric id for the subject, try id-based endpoint first
            try
            {
                var subjJson = await GetSubjectAsync(subjectName);
                if (!string.IsNullOrWhiteSpace(subjJson))
                {
                    try
                    {
                        using var doc = JsonDocument.Parse(subjJson);
                        if (
                            doc.RootElement.TryGetProperty("id", out var idProp)
                            && idProp.ValueKind == JsonValueKind.Number
                        )
                        {
                            var idStr = idProp.GetRawText();
                            // prefer id-based subject endpoint
                            candidates.Insert(0, $"/api/v1/subject/{idStr}/face");
                        }
                    }
                    catch { }
                }
            }
            catch { }

            string[] fieldNames = new[] { "file", "image" };
            var errors = new System.Text.StringBuilder();

            foreach (var url in candidates)
            {
                foreach (var field in fieldNames)
                {
                    attempted.Add(url + " [" + field + "]");
                    var (ok, resp, body) = await TryPost(url, field);
                    if (ok)
                        return body;
                    errors.AppendLine($"{url} field={field} -> {(int)resp.StatusCode}: {body}");
                }
            }

            throw new HttpRequestException(
                $"CompreFace AddFace failed. Attempts: {string.Join(", ", attempted)}\nDetails:\n{errors}"
            );
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

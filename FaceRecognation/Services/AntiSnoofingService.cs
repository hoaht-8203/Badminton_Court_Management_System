using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using FaceRecognation.Services.Interfaces;

namespace FaceRecognation.Services
{
    /// <summary>
    /// Simple anti-spoofing client. Posts the image bytes to the configured
    /// anti-spoofing endpoint and attempts to parse an `is_real` boolean from
    /// the JSON response.
    /// </summary>
    public class AntiSnoofingService : IAntiSnoofingService
    {
        private readonly HttpClient _httpClient;

        public AntiSnoofingService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<bool> CheckLivenessAsync(byte[] imageBytes)
        {
            using var content = new MultipartFormDataContent();
            var imageContent = new ByteArrayContent(imageBytes);
            imageContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
            // many anti-spoofing endpoints expect the file field name to be `file`
            content.Add(imageContent, "file", "capture.png");

            // Post to the `/check-liveness` endpoint (matches previous MainWindow usage)
            var response = await _httpClient.PostAsync("/check-liveness", content);
            if (!response.IsSuccessStatusCode)
                return false;

            var json = await response.Content.ReadAsStringAsync();

            try
            {
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("is_real", out var isRealElement))
                {
                    if (isRealElement.ValueKind == JsonValueKind.True)
                        return true;
                    if (isRealElement.ValueKind == JsonValueKind.False)
                        return false;
                    if (isRealElement.ValueKind == JsonValueKind.Number)
                        return isRealElement.GetDouble() > 0.5; // treat numeric score as probability
                    if (
                        isRealElement.ValueKind == JsonValueKind.String
                        && bool.TryParse(isRealElement.GetString(), out var b)
                    )
                        return b;
                }

                // fallback: some services return { "result": { "is_real": true } }
                if (
                    doc.RootElement.TryGetProperty("result", out var result)
                    && result.ValueKind == JsonValueKind.Object
                )
                {
                    if (result.TryGetProperty("is_real", out var nestedIsReal))
                    {
                        if (nestedIsReal.ValueKind == JsonValueKind.True)
                            return true;
                        if (nestedIsReal.ValueKind == JsonValueKind.False)
                            return false;
                        if (nestedIsReal.ValueKind == JsonValueKind.Number)
                            return nestedIsReal.GetDouble() > 0.5;
                    }
                }
            }
            catch
            {
                // ignore parse errors and return false
            }

            return false;
        }
    }
}

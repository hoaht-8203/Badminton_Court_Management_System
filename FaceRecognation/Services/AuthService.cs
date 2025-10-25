using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FaceRecognation.Dtos;
using FaceRecognation.Services.Interfaces;

namespace FaceRecognation.Services
{
    public class AuthService : IAuthService
    {
        private readonly HttpClient _http;
        public string? CurrentUserJson { get; private set; }

        public AuthService(HttpClient http)
        {
            _http = http ?? throw new ArgumentNullException(nameof(http));
            _http.DefaultRequestHeaders.Accept.Clear();
            _http.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json")
            );
        }

        public async Task<(bool Success, string? RawData, string? Message)> LoginAsync(
            string email,
            string password
        )
        {
            var payload = new { Email = email, Password = password };
            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            var resp = await _http.PostAsync("/api/auth/login", content);
            if (!resp.IsSuccessStatusCode)
            {
                // Try read ApiResponse<string> or fallback to message
                try
                {
                    var err = await resp.Content.ReadFromJsonAsync<ApiResponse<JsonElement>>();
                    if (err != null && !string.IsNullOrEmpty(err.Message))
                        return (false, null, err.Message);
                }
                catch { }

                return (false, null, $"HTTP {resp.StatusCode}");
            }

            var apiResp = await resp.Content.ReadFromJsonAsync<ApiResponse<JsonElement>>();
            if (apiResp == null)
                return (false, null, "Empty response from server");

            if (apiResp.Success)
            {
                string? rawData = null;
                if (
                    apiResp.Data.ValueKind != JsonValueKind.Undefined
                    && apiResp.Data.ValueKind != JsonValueKind.Null
                )
                {
                    rawData = apiResp.Data.GetRawText();
                    CurrentUserJson = rawData;
                }

                return (true, rawData, null);
            }

            return (false, null, apiResp.Message);
        }

        public Task LogoutAsync()
        {
            // For now, removing cookies is left to consumer or we can call an API endpoint if available.
            CurrentUserJson = null;
            return Task.CompletedTask;
        }
    }
}

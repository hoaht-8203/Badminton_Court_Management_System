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
        public Dtos.CurrentUserResponse? CurrentUser { get; private set; }
        public string? CurrentUserJson { get; private set; }

        public AuthService(HttpClient http)
        {
            _http = http ?? throw new ArgumentNullException(nameof(http));
            _http.DefaultRequestHeaders.Accept.Clear();
            _http.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json")
            );
        }

        public async Task<ApiResponse<Dtos.CurrentUserResponse>> LoginAsync(
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
                        return new ApiResponse<Dtos.CurrentUserResponse>
                        {
                            Success = false,
                            Message = err.Message,
                            Data = null,
                        };
                }
                catch { }

                return new ApiResponse<Dtos.CurrentUserResponse>
                {
                    Success = false,
                    Message = $"HTTP {resp.StatusCode}",
                    Data = null,
                };
            }

            var apiResp = await resp.Content.ReadFromJsonAsync<
                ApiResponse<Dtos.CurrentUserResponse>
            >();
            if (apiResp == null)
                return new ApiResponse<Dtos.CurrentUserResponse>
                {
                    Success = false,
                    Message = "Empty response from server",
                    Data = null,
                };

            if (apiResp.Success)
            {
                // Store typed object and a JSON debug copy
                CurrentUser = apiResp.Data;
                CurrentUserJson =
                    apiResp.Data != null ? JsonSerializer.Serialize(apiResp.Data) : null;
            }

            return apiResp;
        }

        public Task LogoutAsync()
        {
            // For now, removing cookies is left to consumer or we can call an API endpoint if available.
            CurrentUser = null;
            CurrentUserJson = null;
            return Task.CompletedTask;
        }

        /// <summary>
        /// Check whether the currently stored CurrentUserJson contains the specified role.
        /// The CurrentUserJson is expected to be the raw JSON contents of the server "data" field
        /// (for example: { "roles": ["Admin"] }). Returns false if parsing fails or role not present.
        /// </summary>
        public bool HasRole(string role)
        {
            if (string.IsNullOrEmpty(role))
                return false;

            // Prefer typed CurrentUser when available
            if (CurrentUser != null && CurrentUser.Roles != null)
            {
                foreach (var r in CurrentUser.Roles)
                {
                    if (string.Equals(r, role, StringComparison.OrdinalIgnoreCase))
                        return true;
                }
                return false;
            }

            if (string.IsNullOrEmpty(CurrentUserJson))
                return false;

            try
            {
                using var doc = JsonDocument.Parse(CurrentUserJson);
                var root = doc.RootElement;
                // Support two shapes:
                // 1) CurrentUserJson is the "data" object: { "roles": ["Admin"] }
                // 2) CurrentUserJson is the full API response: { "success": true, "data": { "roles": [...] }, ... }
                JsonElement rolesElem = default;

                if (root.ValueKind == JsonValueKind.Object)
                {
                    if (
                        root.TryGetProperty("roles", out var r1)
                        && r1.ValueKind == JsonValueKind.Array
                    )
                    {
                        rolesElem = r1;
                    }
                    else if (
                        root.TryGetProperty("data", out var dataProp)
                        && dataProp.ValueKind == JsonValueKind.Object
                        && dataProp.TryGetProperty("roles", out var r2)
                        && r2.ValueKind == JsonValueKind.Array
                    )
                    {
                        rolesElem = r2;
                    }
                }

                if (rolesElem.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in rolesElem.EnumerateArray())
                    {
                        if (
                            item.ValueKind == JsonValueKind.String
                            && string.Equals(
                                item.GetString(),
                                role,
                                StringComparison.OrdinalIgnoreCase
                            )
                        )
                            return true;
                    }
                }

                return false;
            }
            catch
            {
                return false;
            }
        }
    }
}

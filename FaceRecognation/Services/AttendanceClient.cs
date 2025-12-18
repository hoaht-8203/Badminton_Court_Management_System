using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FaceRecognation.Dtos;
using FaceRecognation.Services.Interfaces;

namespace FaceRecognation.Services
{
    public class AttendanceClient : IAttendanceClient
    {
        private readonly HttpClient _http;

        public AttendanceClient(HttpClient http)
        {
            _http = http ?? throw new ArgumentNullException(nameof(http));
        }

        public async Task<ApiResponse<bool>> CheckInAsync(int staffId)
        {
            try
            {
                var payload = new { StaffId = staffId };
                var resp = await _http.PostAsJsonAsync("/api/attendance/checkin", payload);
                
                // Read response content as string first for debugging
                var content = await resp.Content.ReadAsStringAsync();
                
                if (!resp.IsSuccessStatusCode)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = $"HTTP {(int)resp.StatusCode}: {content}",
                    };
                }
                
                var body = await resp.Content.ReadFromJsonAsync<ApiResponse<bool>>();
                return body
                    ?? new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Empty response from server",
                    };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Error: {ex.Message}",
                };
            }
        }

        public async Task<ApiResponse<bool>> CheckOutAsync(int staffId)
        {
            try
            {
                var payload = new { StaffId = staffId };
                var resp = await _http.PostAsJsonAsync("/api/attendance/checkout", payload);
                
                // Read response content as string first for debugging
                var content = await resp.Content.ReadAsStringAsync();
                
                if (!resp.IsSuccessStatusCode)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = $"HTTP {(int)resp.StatusCode}: {content}",
                    };
                }
                
                var body = await resp.Content.ReadFromJsonAsync<ApiResponse<bool>>();
                return body
                    ?? new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Empty response from server",
                    };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Error: {ex.Message}",
                };
            }
        }
    }
}

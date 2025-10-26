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
            var payload = new { StaffId = staffId };
            var resp = await _http.PostAsJsonAsync("/api/attendance/checkin", payload);
            var body = await resp.Content.ReadFromJsonAsync<ApiResponse<bool>>();
            return body ?? new ApiResponse<bool> { Success = false, Message = $"HTTP {(int)resp.StatusCode}" };
        }

        public async Task<ApiResponse<bool>> CheckOutAsync(int staffId)
        {
            var payload = new { StaffId = staffId };
            var resp = await _http.PostAsJsonAsync("/api/attendance/checkout", payload);
            var body = await resp.Content.ReadFromJsonAsync<ApiResponse<bool>>();
            return body ?? new ApiResponse<bool> { Success = false, Message = $"HTTP {(int)resp.StatusCode}" };
        }
    }
}

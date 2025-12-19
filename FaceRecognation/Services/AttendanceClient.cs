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
                
                if (!resp.IsSuccessStatusCode)
                {
                    // Try to parse error response to extract message
                    try
                    {
                        var errorBody = await resp.Content.ReadFromJsonAsync<ApiResponse<bool>>();
                        if (errorBody != null && !string.IsNullOrEmpty(errorBody.Message))
                        {
                            return new ApiResponse<bool>
                            {
                                Success = false,
                                Message = errorBody.Message,
                            };
                        }
                    }
                    catch { }
                    
                    // Fallback if parsing fails
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Check-in không thành công. Vui lòng thử lại.",
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
                
                if (!resp.IsSuccessStatusCode)
                {
                    // Try to parse error response to extract message
                    try
                    {
                        var errorBody = await resp.Content.ReadFromJsonAsync<ApiResponse<bool>>();
                        if (errorBody != null && !string.IsNullOrEmpty(errorBody.Message))
                        {
                            return new ApiResponse<bool>
                            {
                                Success = false,
                                Message = errorBody.Message,
                            };
                        }
                    }
                    catch { }
                    
                    // Fallback if parsing fails
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Check-out không thành công. Vui lòng thử lại.",
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

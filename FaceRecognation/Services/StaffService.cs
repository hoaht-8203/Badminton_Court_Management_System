using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using FaceRecognation.Dtos;
using FaceRecognation.Services.Interfaces;

namespace FaceRecognation.Services
{
    public class StaffService : IStaffService
    {
        private readonly HttpClient _http;

        public StaffService(HttpClient http)
        {
            _http = http ?? throw new ArgumentNullException(nameof(http));
        }

        public async Task<List<StaffResponseDto>> GetAllAsync(ListStaffRequestDto request)
        {
            // Build query string from request properties (simple approach)
            var query = new List<string>();
            if (request.Status.HasValue)
                query.Add($"Status={request.Status.Value}");
            if (request.DepartmentIds != null && request.DepartmentIds.Count > 0)
                foreach (var id in request.DepartmentIds)
                    query.Add($"DepartmentIds={id}");
            if (request.BranchIds != null && request.BranchIds.Count > 0)
                foreach (var id in request.BranchIds)
                    query.Add($"BranchIds={id}");
            if (!string.IsNullOrEmpty(request.Keyword))
                query.Add($"Keyword={Uri.EscapeDataString(request.Keyword)}");

            var url =
                "/api/staff" + (query.Count > 0 ? "?" + string.Join("&", query) : string.Empty);

            var resp = await _http.GetAsync(url);
            resp.EnsureSuccessStatusCode();
            var apiResp = await resp.Content.ReadFromJsonAsync<
                ApiResponse<List<StaffResponseDto>>
            >();
            return apiResp?.Data ?? new List<StaffResponseDto>();
        }

        public async Task<StaffResponseDto?> GetByIdAsync(int id)
        {
            var resp = await _http.GetAsync($"/api/staff/{id}");
            if (resp.StatusCode == System.Net.HttpStatusCode.NotFound)
                return null;
            resp.EnsureSuccessStatusCode();
            var apiResp = await resp.Content.ReadFromJsonAsync<ApiResponse<StaffResponseDto>>();
            return apiResp?.Data;
        }

        public async Task CreateAsync(StaffRequestDto request)
        {
            var resp = await _http.PostAsJsonAsync("/api/staff", request);
            resp.EnsureSuccessStatusCode();
        }

        public async Task UpdateAsync(int id, StaffRequestDto request)
        {
            var resp = await _http.PutAsJsonAsync($"/api/staff/{id}", request);
            resp.EnsureSuccessStatusCode();
        }

        public async Task ChangeStatusAsync(ChangeStaffStatusRequestDto request)
        {
            var resp = await _http.PostAsJsonAsync("/api/staff/change-status", request);
            resp.EnsureSuccessStatusCode();
        }

        public async Task DeleteAsync(int id)
        {
            var resp = await _http.DeleteAsync($"/api/staff/{id}");
            resp.EnsureSuccessStatusCode();
        }
    }
}

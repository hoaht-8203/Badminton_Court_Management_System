using ApiApplication.Dtos;

namespace ApiApplication.Services;

public interface ISystemConfigService
{
    Task<SystemConfigResponse?> GetByKeyAsync(string key);
    Task<List<SystemConfigResponse>> GetByGroupAsync(string group);
    Task<bool> UpdateValueAsync(string key, string value);
}

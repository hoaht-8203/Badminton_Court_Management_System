using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Entities;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class SystemConfigService(ApplicationDbContext context, IMapper mapper)
    : ISystemConfigService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;

    public async Task<SystemConfigResponse?> GetByKeyAsync(string key)
    {
        var config = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.Key == key);

        // Tạo mới nếu chưa tồn tại
        if (config == null && key == "Holidays")
        {
            config = new SystemConfig
            {
                Key = "Holidays",
                Value = "[]",
                Description = "Chế độ nghỉ lễ của hệ thống",
            };
            _context.SystemConfigs.Add(config);
            await _context.SaveChangesAsync();
        }

        return config == null ? null : _mapper.Map<SystemConfigResponse>(config);
    }

    public async Task<List<SystemConfigResponse>> GetByGroupAsync(string group)
    {
        var configs = await _context.SystemConfigs.Where(c => c.Group == group).ToListAsync();
        return _mapper.Map<List<SystemConfigResponse>>(configs);
    }

    public async Task<bool> UpdateValueAsync(string key, string value)
    {
        var config = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.Key == key);
        if (config == null)
        {
            // Tạo mới nếu chưa tồn tại
            config = new SystemConfig
            {
                Key = key,
                Value = value,
                Description = key == "Holidays" ? "Chế độ nghỉ lễ của hệ thống" : null,
            };
            _context.SystemConfigs.Add(config);
        }
        else
        {
            config.Value = value;
        }

        await _context.SaveChangesAsync();
        return true;
    }
}

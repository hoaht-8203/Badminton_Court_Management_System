using System;
using System.Globalization;
using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Entities;
using ApiApplication.Sessions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class ActivityService(
    ApplicationDbContext context,
    IMapper mapper,
    ICurrentUser currentUser,
    ILogger<ActivityService> logger
) : IActivityService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly ICurrentUser _currentUser = currentUser;
    private readonly ILogger<ActivityService> _logger = logger;

    public async Task CreateActivityAsync(CreateActivityRequest request)
    {
        var activity = _mapper.Map<Activity>(request);
        activity.Description = GenerateDescription(request.UserName, request.Action, request.Value);
        activity.ValueFormatted = FormatValue(request.Value);
        activity.ActivityTime = DateTime.UtcNow;

        _context.Activities.Add(activity);
        await _context.SaveChangesAsync();

        var response = _mapper.Map<ListActivityResponse>(activity);
        response.TimeAgo = GetTimeAgo(activity.ActivityTime);
    }

    public async Task<List<ListActivityResponse>> GetActivitiesAsync(ListActivityRequest request)
    {
        var query = _context.Activities.AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(request.UserName))
        {
            query = query.Where(x => x.UserName.Contains(request.UserName));
        }

        if (!string.IsNullOrEmpty(request.Action))
        {
            query = query.Where(x => x.Action.Contains(request.Action));
        }

        if (request.FromDate.HasValue)
        {
            query = query.Where(x => x.ActivityTime >= request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(x => x.ActivityTime <= request.ToDate.Value);
        }

        var responses = _mapper.Map<List<ListActivityResponse>>(await query.ToListAsync());

        // Add TimeAgo for each activity
        foreach (var response in responses)
        {
            response.TimeAgo = GetTimeAgo(response.ActivityTime);
        }

        return responses;
    }

    private static string FormatValue(decimal value)
    {
        return value.ToString("N0", new CultureInfo("vi-VN"));
    }

    private static string GenerateDescription(string userName, string action, decimal value)
    {
        var valueFormatted = FormatValue(value);
        return $"{userName} vừa {action} với giá trị {valueFormatted}";
    }

    private static string GetTimeAgo(DateTime activityTime)
    {
        var timeSpan = DateTime.UtcNow - activityTime;

        if (timeSpan.TotalMinutes < 1)
            return "vừa xong";

        if (timeSpan.TotalMinutes < 60)
            return $"{(int)timeSpan.TotalMinutes} phút trước";

        if (timeSpan.TotalHours < 24)
            return $"{(int)timeSpan.TotalHours} giờ trước";

        if (timeSpan.TotalDays < 7)
            return $"{(int)timeSpan.TotalDays} ngày trước";

        if (timeSpan.TotalDays < 30)
            return $"{(int)(timeSpan.TotalDays / 7)} tuần trước";

        if (timeSpan.TotalDays < 365)
            return $"{(int)(timeSpan.TotalDays / 30)} tháng trước";

        return $"{(int)(timeSpan.TotalDays / 365)} năm trước";
    }
}

using System;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Activity;

namespace ApiApplication.Services.Impl;

public class ActivityHelperService(IActivityService activityService) : IActivityHelperService
{
    private readonly IActivityService _activityService = activityService;

    public async Task CreateSaleActivityAsync(
        string userName,
        decimal value,
        string? orderId = null
    )
    {
        var request = new CreateActivityRequest
        {
            UserName = userName,
            Action = "bán đơn hàng",
            Value = value,
            OrderId = orderId,
        };

        await _activityService.CreateActivityAsync(request);
    }

    public async Task CreatePurchaseActivityAsync(
        string userName,
        decimal value,
        string? orderId = null
    )
    {
        var request = new CreateActivityRequest
        {
            UserName = userName,
            Action = "nhập hàng",
            Value = value,
            OrderId = orderId,
        };

        await _activityService.CreateActivityAsync(request);
    }

    public async Task CreateDeliveryActivityAsync(
        string userName,
        decimal value,
        string? orderId = null
    )
    {
        var request = new CreateActivityRequest
        {
            UserName = userName,
            Action = "bán đơn giao hàng",
            Value = value,
            OrderId = orderId,
        };

        await _activityService.CreateActivityAsync(request);
    }

    public async Task CreateCustomActivityAsync(
        string userName,
        string action,
        decimal value,
        string? orderId = null,
        string? orderType = null
    )
    {
        var request = new CreateActivityRequest
        {
            UserName = userName,
            Action = action,
            Value = value,
            OrderId = orderId,
        };

        await _activityService.CreateActivityAsync(request);
    }
}

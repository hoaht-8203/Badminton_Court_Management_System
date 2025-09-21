using System;
using ApiApplication.Dtos;

namespace ApiApplication.Services;

public interface IActivityHelperService
{
    Task CreateSaleActivityAsync(string userName, decimal value, string? orderId = null);
    Task CreatePurchaseActivityAsync(string userName, decimal value, string? orderId = null);
    Task CreateDeliveryActivityAsync(string userName, decimal value, string? orderId = null);
    Task CreateCustomActivityAsync(
        string userName,
        string action,
        decimal value,
        string? orderId = null,
        string? orderType = null
    );
}

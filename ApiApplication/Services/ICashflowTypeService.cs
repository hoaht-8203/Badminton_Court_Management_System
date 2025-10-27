using System;
using ApiApplication.Entities;

namespace ApiApplication.Services;

public interface ICashflowTypeService
{
    Task<List<CashflowType>> GetAllCashflowTypesAsync(bool IsPayment);
}

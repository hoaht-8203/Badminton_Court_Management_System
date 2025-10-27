using System;
using ApiApplication.Data;
using ApiApplication.Entities;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class CashFlowTypeService : ICashflowTypeService
{
    private ApplicationDbContext _dbContext;

    public CashFlowTypeService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<CashflowType>> GetAllCashflowTypesAsync(bool IsPayment)
    {
        return await _dbContext.CashflowTypes.Where(c => c.IsPayment == IsPayment).ToListAsync();
    }
}

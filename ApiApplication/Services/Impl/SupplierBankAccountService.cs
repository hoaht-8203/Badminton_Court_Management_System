using ApiApplication.Data;
using ApiApplication.Dtos.SupplierBankAccount;
using ApiApplication.Entities;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class SupplierBankAccountService(ApplicationDbContext context) : ISupplierBankAccountService
{
    private readonly ApplicationDbContext _context = context;

    public async Task<List<SupplierBankAccount>> ListAsync(int supplierId)
    {
        return await _context
            .SupplierBankAccounts.Where(x => x.SupplierId == supplierId)
            .OrderByDescending(x => x.IsDefault)
            .ThenByDescending(x => x.UpdatedAt)
            .ToListAsync();
    }

    public async Task<int> CreateAsync(UpsertBankAccountRequest req)
    {
        var entity = new SupplierBankAccount
        {
            SupplierId = req.SupplierId,
            AccountNumber = req.AccountNumber,
            AccountName = req.AccountName,
            BankName = req.BankName,
            IsDefault = req.IsDefault,
        };
        _context.SupplierBankAccounts.Add(entity);
        await _context.SaveChangesAsync();
        return entity.Id;
    }

    public async Task UpdateAsync(int id, UpsertBankAccountRequest req)
    {
        var entity =
            await _context.SupplierBankAccounts.FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new KeyNotFoundException("Supplier bank account not found");
        entity.AccountNumber = req.AccountNumber;
        entity.AccountName = req.AccountName;
        entity.BankName = req.BankName;
        entity.IsDefault = req.IsDefault;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var entity =
            await _context.SupplierBankAccounts.FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new KeyNotFoundException("Supplier bank account not found");
        _context.SupplierBankAccounts.Remove(entity);
        await _context.SaveChangesAsync();
    }
}

using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos.SupplierBankAccount;
using ApiApplication.Entities;
using ApiApplication.Exceptions;
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
        // Check for required fields
        if (
            string.IsNullOrEmpty(req.AccountNumber)
            || string.IsNullOrEmpty(req.AccountName)
            || string.IsNullOrEmpty(req.BankName)
        )
        {
            throw new ApiException(
                "Số tài khoản, tên tài khoản và tên ngân hàng là các trường bắt buộc",
                HttpStatusCode.BadRequest
            );
        }

        var entity = new SupplierBankAccount
        {
            SupplierId = req.SupplierId,
            AccountNumber = req.AccountNumber.Trim(),
            AccountName = req.AccountName.Trim(),
            BankName = req.BankName.Trim(),
            IsDefault = req.IsDefault,
        };
        _context.SupplierBankAccounts.Add(entity);
        await _context.SaveChangesAsync();
        return entity.Id;
    }

    public async Task UpdateAsync(int id, UpsertBankAccountRequest req)
    {
        // Check for required fields
        if (
            string.IsNullOrEmpty(req.AccountNumber)
            || string.IsNullOrEmpty(req.AccountName)
            || string.IsNullOrEmpty(req.BankName)
        )
        {
            throw new ApiException(
                "Số tài khoản, tên tài khoản và tên ngân hàng là các trường bắt buộc",
                HttpStatusCode.BadRequest
            );
        }

        var entity =
            await _context.SupplierBankAccounts.FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new ApiException(
                "Không tìm thấy tài khoản ngân hàng nhà cung cấp",
                HttpStatusCode.NotFound
            );

        entity.AccountNumber = req.AccountNumber.Trim();
        entity.AccountName = req.AccountName.Trim();
        entity.BankName = req.BankName.Trim();
        entity.IsDefault = req.IsDefault;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var entity =
            await _context.SupplierBankAccounts.FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new ApiException(
                "Không tìm thấy tài khoản ngân hàng nhà cung cấp",
                HttpStatusCode.NotFound
            );
        _context.SupplierBankAccounts.Remove(entity);
        await _context.SaveChangesAsync();
    }
}

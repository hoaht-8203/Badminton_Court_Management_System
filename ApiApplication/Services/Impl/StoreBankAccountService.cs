using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos.StoreBankAccount;
using ApiApplication.Entities;
using ApiApplication.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl
{
    public class StoreBankAccountService : IStoreBankAccountService
    {
        private readonly ApplicationDbContext _context;

        public StoreBankAccountService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<StoreBankAccountResponse>> ListAsync()
        {
            return await _context
                .StoreBankAccounts.AsNoTracking()
                .OrderByDescending(x => x.IsDefault)
                .Select(x => new StoreBankAccountResponse
                {
                    Id = x.Id,
                    AccountNumber = x.AccountNumber,
                    AccountName = x.AccountName,
                    BankName = x.BankName,
                    IsDefault = x.IsDefault,
                })
                .ToListAsync();
        }

        public async Task<StoreBankAccountResponse> CreateAsync(
            CreateStoreBankAccountRequest request
        )
        {
            // Check for required fields
            if (
                string.IsNullOrEmpty(request.AccountNumber)
                || string.IsNullOrEmpty(request.AccountName)
                || string.IsNullOrEmpty(request.BankName)
            )
            {
                throw new ApiException(
                    "Số tài khoản, tên tài khoản và tên ngân hàng là các trường bắt buộc",
                    HttpStatusCode.BadRequest
                );
            }

            var entity = new StoreBankAccount
            {
                AccountNumber = request.AccountNumber.Trim(),
                AccountName = request.AccountName.Trim(),
                BankName = request.BankName.Trim(),
            };
            _context.StoreBankAccounts.Add(entity);
            await _context.SaveChangesAsync();
            return new StoreBankAccountResponse
            {
                Id = entity.Id,
                AccountNumber = entity.AccountNumber,
                AccountName = entity.AccountName,
                BankName = entity.BankName,
                IsDefault = entity.IsDefault,
            };
        }

        public async Task<string> UpdateAsync(int id, CreateStoreBankAccountRequest request)
        {
            var entity =
                await _context.StoreBankAccounts.FindAsync(id)
                ?? throw new ApiException(
                    "Không tìm thấy tài khoản ngân hàng",
                    HttpStatusCode.NotFound
                );
            // Check for required fields
            if (
                string.IsNullOrEmpty(request.AccountNumber)
                || string.IsNullOrEmpty(request.AccountName)
                || string.IsNullOrEmpty(request.BankName)
            )
            {
                throw new ApiException(
                    "Số tài khoản, tên tài khoản và tên ngân hàng là các trường bắt buộc",
                    HttpStatusCode.BadRequest
                );
            }

            entity.AccountNumber = request.AccountNumber.Trim();
            entity.AccountName = request.AccountName.Trim();
            entity.BankName = request.BankName.Trim();
            await _context.SaveChangesAsync();
            return "OK";
        }

        public async Task<string> DeleteAsync(int id)
        {
            var entity =
                await _context.StoreBankAccounts.FindAsync(id)
                ?? throw new ApiException(
                    "Không tìm thấy tài khoản ngân hàng",
                    HttpStatusCode.NotFound
                );
            _context.StoreBankAccounts.Remove(entity);
            await _context.SaveChangesAsync();
            return "OK";
        }
    }
}

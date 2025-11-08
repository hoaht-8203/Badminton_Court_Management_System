using ApiApplication.Dtos.Voucher;

namespace ApiApplication.Services;

public interface IVoucherService
{
    Task<List<VoucherResponse>> ListAsync();
    Task<VoucherResponse?> DetailAsync(int id);
    Task<int> CreateAsync(CreateVoucherRequest request);
    Task UpdateAsync(int id, UpdateVoucherRequest request);
    Task ExtendAsync(int id, ExtendVoucherRequest request);
    Task DeleteAsync(int id);
    Task<List<VoucherResponse>> GetAvailableVouchersForCurrentUserAsync();
    Task<ValidateVoucherResponse> ValidateAndCalculateDiscountAsync(
        ValidateVoucherRequest request,
        int customerId
    );
    Task RecordVoucherUsageAsync(
        int voucherId,
        int customerId,
        Guid orderId,
        decimal discountAmount
    );
}

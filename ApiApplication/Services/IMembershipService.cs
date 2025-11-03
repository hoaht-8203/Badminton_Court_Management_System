using ApiApplication.Dtos.Membership;

namespace ApiApplication.Services;

public interface IMembershipService
{
    Task<List<ListMembershipResponse>> ListAsync(ListMembershipRequest request);
    Task<DetailMembershipResponse> DetailAsync(int id);
    Task CreateAsync(CreateMembershipRequest request);
    Task UpdateAsync(UpdateMembershipRequest request);
    Task DeleteAsync(DeleteMembershipRequest request);
    Task UpdateStatusAsync(UpdateMemberShipStatusRequest request);
}

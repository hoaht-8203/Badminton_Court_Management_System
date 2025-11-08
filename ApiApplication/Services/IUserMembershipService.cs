using ApiApplication.Dtos.Membership.UserMembership;

namespace ApiApplication.Services;

public interface IUserMembershipService
{
    Task<List<UserMembershipResponse>> ListAsync(ListUserMembershipRequest request);
    Task<UserMembershipResponse> DetailAsync(int id);
    Task<CreateUserMembershipResponse> CreateAsync(CreateUserMembershipRequest request);
    Task<CreateUserMembershipResponse> CreateForCurrentUserAsync(
        CreateUserMembershipForCurrentUserRequest request
    );
    Task<CreateUserMembershipResponse> ExtendPaymentAsync(ExtendPaymentRequest request);
    Task UpdateStatusAsync(UpdateUserMembershipStatusRequest request);
    Task DeleteAsync(int id);
}

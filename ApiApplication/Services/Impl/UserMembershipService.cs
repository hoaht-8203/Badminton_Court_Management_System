using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos.Membership.UserMembership;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using ApiApplication.Sessions;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class UserMembershipService(
    ApplicationDbContext context,
    IMapper mapper,
    IPaymentService paymentService,
    IConfiguration configuration,
    ICurrentUser currentUser,
    UserManager<ApplicationUser> userManager
) : IUserMembershipService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly IPaymentService _paymentService = paymentService;
    private readonly IConfiguration _configuration = configuration;
    private readonly ICurrentUser _currentUser = currentUser;
    private readonly UserManager<ApplicationUser> _userManager = userManager;

    public async Task<List<ListUserMembershipResponse>> ListAsync(ListUserMembershipRequest request)
    {
        var query = _context
            .UserMemberships.Include(x => x.Membership)
            .Include(x => x.Customer)
            .Include(x => x.Payments)
            .ThenInclude(p => p.Customer)
            .AsQueryable();

        if (request.CustomerId.HasValue)
        {
            query = query.Where(x => x.CustomerId == request.CustomerId.Value);
        }
        if (request.MembershipId.HasValue)
        {
            query = query.Where(x => x.MembershipId == request.MembershipId.Value);
        }
        if (request.IsActive.HasValue)
        {
            query = query.Where(x => x.IsActive == request.IsActive.Value);
        }

        var items = await query.OrderByDescending(x => x.StartDate).ToListAsync();
        var responses = _mapper.Map<List<ListUserMembershipResponse>>(items);

        return responses;
    }

    public async Task<DetailUserMembershipResponse> DetailAsync(int id)
    {
        var item = await _context
            .UserMemberships.Include(x => x.Membership)
            .Include(x => x.Customer)
            .Include(x => x.Payments)
            .ThenInclude(p => p.Customer)
            .Include(x => x.Payments)
            .ThenInclude(p => p.Booking)
            .ThenInclude(b => b!.Court)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (item == null)
        {
            throw new ApiException(
                $"Thông tin hội viên của khách hàng không tồn tại: {id}",
                System.Net.HttpStatusCode.NotFound
            );
        }
        var resp = _mapper.Map<DetailUserMembershipResponse>(item);

        return resp;
    }

    public async Task<CreateUserMembershipResponse> CreateAsync(CreateUserMembershipRequest request)
    {
        var customerExists = await _context.Customers.AnyAsync(c => c.Id == request.CustomerId);
        if (!customerExists)
        {
            throw new ApiException(
                $"Khách hàng không tồn tại: {request.CustomerId}",
                System.Net.HttpStatusCode.NotFound
            );
        }

        // Check if membership exists and is Active
        var membership = await _context.Memberships.FirstOrDefaultAsync(m =>
            m.Id == request.MembershipId
        );
        if (membership == null)
        {
            throw new ApiException(
                $"Gói hội viên không tồn tại: {request.MembershipId}",
                System.Net.HttpStatusCode.NotFound
            );
        }

        // Check if membership status is Active
        if (!string.Equals(membership.Status, "Active", StringComparison.OrdinalIgnoreCase))
        {
            throw new ApiException(
                $"Gói hội viên không ở trạng thái Active, không thể đăng ký.",
                System.Net.HttpStatusCode.BadRequest
            );
        }

        // Prevent overlapping/stacking memberships:
        // - Block if customer has ANY membership that hasn't expired (regardless of status)
        // - Customer must wait for current membership to expire before adding a new one or switching
        var nowCheckUtc = DateTime.UtcNow;
        var hasUnexpiredMembership = await _context.UserMemberships.AnyAsync(um =>
            um.CustomerId == request.CustomerId && um.EndDate > nowCheckUtc
        );
        if (hasUnexpiredMembership)
        {
            throw new ApiException(
                "Khách hàng đang có gói hội viên còn hiệu lực, không thể đăng ký gói mới. Vui lòng chờ hết hạn hoặc đổi sang gói hội viên khác.",
                System.Net.HttpStatusCode.BadRequest
            );
        }

        var entity = _mapper.Map<UserMembership>(request);
        // Handle StartDate/EndDate from Membership.DurationDays using exact time
        var nowUtc = DateTime.UtcNow;
        entity.StartDate = nowUtc;
        var duration = Math.Max(1, membership.DurationDays);
        entity.EndDate = nowUtc.AddDays(duration);

        // Set initial status and IsActive based on payment method
        var initialMethod = string.IsNullOrWhiteSpace(request.PaymentMethod)
            ? "Bank"
            : request.PaymentMethod!;
        if (string.Equals(initialMethod, "Cash", StringComparison.OrdinalIgnoreCase))
        {
            entity.Status = "Paid";
            entity.IsActive = true; // cash payment activates immediately
        }
        else
        {
            entity.Status = "PendingPayment";
            entity.IsActive = false; // bank transfer pending until webhook confirms
        }

        _context.UserMemberships.Add(entity);
        await _context.SaveChangesAsync();

        // Create payment for membership purchase
        var method = string.IsNullOrWhiteSpace(request.PaymentMethod)
            ? "Bank"
            : request.PaymentMethod!;
        var paymentDto = await _paymentService.CreatePaymentForMembershipAsync(
            new ApiApplication.Dtos.Payment.CreatePaymentForMembershipRequest
            {
                UserMembershipId = entity.Id,
                CustomerId = entity.CustomerId,
                Amount = membership.Price,
                PaymentMethod = method,
                Note = request.PaymentNote,
            }
        );

        // Build response with payment info similar to checkout
        var resp = new CreateUserMembershipResponse
        {
            UserMembershipId = entity.Id,
            CustomerId = entity.CustomerId,
            MembershipId = entity.MembershipId,
            Status = entity.Status,
            IsActive = entity.IsActive,
            StartDate = entity.StartDate,
            EndDate = entity.EndDate,
            PaymentId = paymentDto.Id,
            PaymentAmount = paymentDto.Amount,
            PaymentMethod = method,
            QrUrl = string.Empty,
            HoldMinutes = 0,
            ExpiresAtUtc = DateTime.UtcNow,
        };

        // If transfer (Bank), generate QR similar to OrderService
        var isCash = string.Equals(method, "Cash", StringComparison.OrdinalIgnoreCase);
        if (!isCash && resp.PaymentAmount > 0)
        {
            var acc = Environment.GetEnvironmentVariable("SEPAY_ACC") ?? "VQRQAEMLF5363";
            var bank = Environment.GetEnvironmentVariable("SEPAY_BANK") ?? "MBBank";
            var amount = ((long)Math.Ceiling(resp.PaymentAmount)).ToString();
            var des = Uri.EscapeDataString(resp.PaymentId);
            resp.QrUrl = $"https://qr.sepay.vn/img?acc={acc}&bank={bank}&amount={amount}&des={des}";
            resp.HoldMinutes = _configuration.GetValue<int?>("Booking:HoldMinutes") ?? 5;
            resp.ExpiresAtUtc = DateTime.UtcNow.AddMinutes(resp.HoldMinutes);
        }

        return resp;
    }

    public async Task<CreateUserMembershipResponse> CreateForCurrentUserAsync(
        CreateUserMembershipForCurrentUserRequest request
    )
    {
        // Get current user ID
        var userId = _currentUser.UserId;
        if (userId == null)
        {
            throw new ApiException(
                "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.",
                System.Net.HttpStatusCode.Unauthorized
            );
        }

        // Get ApplicationUser
        var user = await _userManager.FindByIdAsync(userId.Value.ToString());
        if (user == null)
        {
            throw new ApiException(
                "Không tìm thấy tài khoản người dùng.",
                System.Net.HttpStatusCode.NotFound
            );
        }

        // Check if user already has a Customer record
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);

        if (customer == null)
        {
            throw new ApiException(
                "Vui lòng xác nhận email để tạo tài khoản khách hàng trước khi đăng ký gói hội viên.",
                HttpStatusCode.BadRequest
            );
        }

        // Now create membership using the existing CreateAsync logic
        // Convert CreateUserMembershipForCurrentUserRequest to CreateUserMembershipRequest
        // User must pay via bank transfer (no cash option for self-registration)
        var createRequest = new CreateUserMembershipRequest
        {
            CustomerId = customer.Id,
            MembershipId = request.MembershipId,
            IsActive = request.IsActive,
            PaymentMethod = "Bank", // Force bank transfer for user self-registration
            PaymentNote = request.PaymentNote,
        };

        return await CreateAsync(createRequest);
    }

    public async Task<CreateUserMembershipResponse> ExtendPaymentAsync(ExtendPaymentRequest request)
    {
        var entity = await _context
            .UserMemberships.Include(x => x.Membership)
            .FirstOrDefaultAsync(x => x.Id == request.UserMembershipId);
        if (entity == null)
        {
            throw new ApiException(
                $"Thông tin hội viên của khách hàng không tồn tại: {request.UserMembershipId}",
                System.Net.HttpStatusCode.NotFound
            );
        }

        // Only allow extend when not already paid
        if (string.Equals(entity.Status, "Paid", StringComparison.OrdinalIgnoreCase))
        {
            throw new ApiException("Hội viên đã được thanh toán.");
        }

        // Reset to pending payment and inactive
        entity.Status = "PendingPayment";
        entity.IsActive = false;
        await _context.SaveChangesAsync();

        var method = "Bank";
        var paymentDto = await _paymentService.CreatePaymentForMembershipAsync(
            new ApiApplication.Dtos.Payment.CreatePaymentForMembershipRequest
            {
                UserMembershipId = entity.Id,
                CustomerId = entity.CustomerId,
                Amount = entity.Membership!.Price,
                PaymentMethod = method,
                Note = request.Note,
            }
        );

        var resp = new CreateUserMembershipResponse
        {
            UserMembershipId = entity.Id,
            CustomerId = entity.CustomerId,
            MembershipId = entity.MembershipId,
            Status = entity.Status,
            IsActive = entity.IsActive,
            StartDate = entity.StartDate,
            EndDate = entity.EndDate,
            PaymentId = paymentDto.Id,
            PaymentAmount = paymentDto.Amount,
            PaymentMethod = method,
            QrUrl = string.Empty,
            HoldMinutes = 0,
            ExpiresAtUtc = DateTime.UtcNow,
        };

        // Build QR
        if (resp.PaymentAmount > 0)
        {
            var acc = Environment.GetEnvironmentVariable("SEPAY_ACC") ?? "VQRQAEMLF5363";
            var bank = Environment.GetEnvironmentVariable("SEPAY_BANK") ?? "MBBank";
            var amount = ((long)Math.Ceiling(resp.PaymentAmount)).ToString();
            var des = Uri.EscapeDataString(resp.PaymentId);
            resp.QrUrl = $"https://qr.sepay.vn/img?acc={acc}&bank={bank}&amount={amount}&des={des}";
            resp.HoldMinutes = _configuration.GetValue<int?>("Booking:HoldMinutes") ?? 5;
            resp.ExpiresAtUtc = DateTime.UtcNow.AddMinutes(resp.HoldMinutes);
        }

        return resp;
    }

    public async Task UpdateStatusAsync(UpdateUserMembershipStatusRequest request)
    {
        var entity = await _context.UserMemberships.FirstOrDefaultAsync(x => x.Id == request.Id);
        if (entity == null)
        {
            throw new ApiException(
                $"Thông tin hội viên của khách hàng không tồn tại: {request.Id}",
                System.Net.HttpStatusCode.NotFound
            );
        }
        entity.IsActive = request.IsActive;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _context.UserMemberships.FirstOrDefaultAsync(x => x.Id == id);
        if (entity == null)
        {
            throw new ApiException(
                $"Thông tin hội viên của khách hàng không tồn tại: {id}",
                System.Net.HttpStatusCode.NotFound
            );
        }

        _context.UserMemberships.Remove(entity);
        await _context.SaveChangesAsync();
    }
}

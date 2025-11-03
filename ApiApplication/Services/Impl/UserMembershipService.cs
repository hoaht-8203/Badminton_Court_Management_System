using ApiApplication.Data;
using ApiApplication.Dtos.Membership.UserMembership;
using ApiApplication.Entities;
using ApiApplication.Exceptions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class UserMembershipService(
    ApplicationDbContext context,
    IMapper mapper,
    IPaymentService paymentService,
    IConfiguration configuration
) : IUserMembershipService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly IPaymentService _paymentService = paymentService;
    private readonly IConfiguration _configuration = configuration;

    public async Task<List<UserMembershipResponse>> ListAsync(ListUserMembershipRequest request)
    {
        var query = _context
            .UserMemberships.Include(x => x.Membership)
            .Include(x => x.Customer)
            .Include(x => x.Payments)
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
        var responses = _mapper.Map<List<UserMembershipResponse>>(items);

        // Attach payment info for each membership (all payments and the latest)
        var membershipIds = items.Select(i => i.Id).ToList();
        var allPayments = await _context
            .Payments.Where(p =>
                p.UserMembershipId != null && membershipIds.Contains(p.UserMembershipId.Value)
            )
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var membershipIdToAllPayments = allPayments
            .GroupBy(p => p.UserMembershipId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());
        foreach (var resp in responses)
        {
            if (membershipIdToAllPayments.TryGetValue(resp.Id, out var pays))
            {
                resp.Payments = pays.Select(pay => new ApiApplication.Dtos.Payment.PaymentDto
                    {
                        Id = pay.Id,
                        BookingId = pay.BookingId ?? Guid.Empty,
                        PaymentCreatedAt = pay.CreatedAt,
                        Amount = pay.Amount,
                        Status = pay.Status.ToString(),
                        CustomerId = pay.CustomerId,
                        CustomerName = pay.Customer?.FullName ?? string.Empty,
                        CustomerPhone = pay.Customer?.PhoneNumber,
                        CustomerEmail = pay.Customer?.Email,
                        CourtId = pay.Booking?.CourtId ?? Guid.Empty,
                        CourtName = pay.Booking?.Court?.Name ?? string.Empty,
                        Note = pay.Note,
                    })
                    .ToList();
                resp.Payment = resp.Payments.FirstOrDefault();
            }
        }

        return responses;
    }

    public async Task<UserMembershipResponse> DetailAsync(int id)
    {
        var item = await _context
            .UserMemberships.Include(x => x.Membership)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (item == null)
        {
            throw new ApiException(
                $"Thông tin hội viên của khách hàng không tồn tại: {id}",
                System.Net.HttpStatusCode.NotFound
            );
        }
        var resp = _mapper.Map<UserMembershipResponse>(item);

        // attach all payments and set latest
        var payments = await _context
            .Payments.Where(p => p.UserMembershipId == item.Id)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        if (payments.Count > 0)
        {
            resp.Payments = payments
                .Select(payment => new ApiApplication.Dtos.Payment.PaymentDto
                {
                    Id = payment.Id,
                    BookingId = payment.BookingId ?? Guid.Empty,
                    PaymentCreatedAt = payment.CreatedAt,
                    Amount = payment.Amount,
                    Status = payment.Status.ToString(),
                    CustomerId = payment.CustomerId,
                    CustomerName = payment.Customer?.FullName ?? string.Empty,
                    CustomerPhone = payment.Customer?.PhoneNumber,
                    CustomerEmail = payment.Customer?.Email,
                    CourtId = payment.Booking?.CourtId ?? Guid.Empty,
                    CourtName = payment.Booking?.Court?.Name ?? string.Empty,
                    Note = payment.Note,
                })
                .ToList();
            resp.Payment = resp.Payments.FirstOrDefault();
        }

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
        // Prevent overlapping/stacking memberships:
        // - Block if customer has a Paid membership that hasn't expired
        // - Block if customer has a PendingPayment membership that hasn't expired (avoid multiple pending registrations)
        var nowCheckUtc = DateTime.UtcNow;
        var hasUnexpiredActiveOrPending = await _context.UserMemberships.AnyAsync(um =>
            um.CustomerId == request.CustomerId
            && (um.Status == "Paid" || um.Status == "PendingPayment")
            && um.EndDate > nowCheckUtc
        );
        if (hasUnexpiredActiveOrPending)
        {
            throw new ApiException(
                "Khách hàng đang có gói hội viên còn hiệu lực hoặc đang chờ thanh toán, không thể đăng ký gói mới cho đến khi hoàn tất hoặc hết hạn.",
                System.Net.HttpStatusCode.BadRequest
            );
        }
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

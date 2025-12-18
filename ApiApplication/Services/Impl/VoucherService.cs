using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos.Voucher;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using ApiApplication.Sessions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class VoucherService : IVoucherService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<VoucherService> _logger;

    public VoucherService(
        ApplicationDbContext context,
        IMapper mapper,
        ICurrentUser currentUser,
        ILogger<VoucherService> logger
    )
    {
        _context = context;
        _mapper = mapper;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<int> CreateAsync(CreateVoucherRequest request)
    {
        // basic validation
        if (string.IsNullOrWhiteSpace(request.Code))
            throw new ApiException("Mã voucher không được để trống", HttpStatusCode.BadRequest);

        if (request.StartAt >= request.EndAt)
            throw new ApiException(
                "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc",
                HttpStatusCode.BadRequest
            );

        // Check for duplicate voucher code
        var existingVoucher = await _context
            .Vouchers.Where(v => v.Code == request.Code)
            .Select(v => new { v.Code, v.Title })
            .FirstOrDefaultAsync();

        if (existingVoucher != null)
        {
            throw new ApiException(
                $"Mã voucher '{existingVoucher.Code}' đã tồn tại trong hệ thống (Voucher: {existingVoucher.Title}). Vui lòng sử dụng mã khác.",
                HttpStatusCode.BadRequest
            );
        }

        // Map request to entity using AutoMapper
        var entity = _mapper.Map<Voucher>(request);
        entity.TimeRules = new List<VoucherTimeRule>();
        entity.UserRules = new List<VoucherUserRule>();

        // Map TimeRules - only keep valid rules
        if (request.TimeRules != null)
        {
            var validTimeRules = request
                .TimeRules.Where(tr => tr.SpecificDate.HasValue || tr.DayOfWeek.HasValue)
                .ToList();
            entity.TimeRules = _mapper.Map<List<VoucherTimeRule>>(validTimeRules);
        }

        // Map UserRules - only keep valid rules
        if (request.UserRules != null)
        {
            var validUserRules = request
                .UserRules.Where(ur =>
                    (ur.SpecificCustomerIds != null && ur.SpecificCustomerIds.Any())
                    || ur.MembershipId.HasValue
                    || ur.IsNewCustomer.HasValue
                )
                .ToList();
            entity.UserRules = _mapper.Map<List<VoucherUserRule>>(validUserRules);
        }

        _context.Vouchers.Add(entity);
        await _context.SaveChangesAsync();
        return entity.Id;
    }

    public async Task DeleteAsync(int id)
    {
        var v = await _context.Vouchers.FindAsync(id);
        if (v == null)
            throw new ApiException("Voucher không tồn tại", HttpStatusCode.NotFound);
        _context.Vouchers.Remove(v);
        await _context.SaveChangesAsync();
    }

    public async Task<VoucherResponse?> DetailAsync(int id)
    {
        var v = await _context
            .Vouchers.Include(x => x.TimeRules)
            .Include(x => x.UserRules)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (v == null)
            return null;
        return _mapper.Map<VoucherResponse>(v);
    }

    public async Task<List<VoucherResponse>> ListAsync()
    {
        var items = await _context
            .Vouchers.Include(x => x.TimeRules)
            .Include(x => x.UserRules)
            .ToListAsync();
        return _mapper.Map<List<VoucherResponse>>(items);
    }

    public async Task UpdateAsync(int id, UpdateVoucherRequest request)
    {
        var v = await _context
            .Vouchers.Include(x => x.TimeRules)
            .Include(x => x.UserRules)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (v == null)
            throw new ApiException("Voucher không tồn tại", HttpStatusCode.NotFound);

        // Validate dates
        if (request.StartAt >= request.EndAt)
            throw new ApiException(
                "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc",
                HttpStatusCode.BadRequest
            );

        // Check code uniqueness (if code is being changed)
        if (!string.IsNullOrWhiteSpace(request.Code) && request.Code != v.Code)
        {
            var existingVoucher = await _context
                .Vouchers.Where(vx => vx.Code == request.Code && vx.Id != id)
                .Select(vx => new
                {
                    vx.Code,
                    vx.Title,
                    vx.Id,
                })
                .FirstOrDefaultAsync();

            if (existingVoucher != null)
            {
                throw new ApiException(
                    $"Mã voucher '{existingVoucher.Code}' đã được sử dụng bởi voucher khác (ID: {existingVoucher.Id}, Tên: {existingVoucher.Title}). Vui lòng chọn mã khác.",
                    HttpStatusCode.BadRequest
                );
            }
        }

        // Update fields using AutoMapper
        _mapper.Map(request, v);

        // Replace rules
        _context.VoucherTimeRules.RemoveRange(v.TimeRules ?? Enumerable.Empty<VoucherTimeRule>());
        _context.VoucherUserRules.RemoveRange(v.UserRules ?? Enumerable.Empty<VoucherUserRule>());

        // Map TimeRules - only keep valid rules
        if (request.TimeRules != null)
        {
            var validTimeRules = request
                .TimeRules.Where(tr => tr.SpecificDate.HasValue || tr.DayOfWeek.HasValue)
                .ToList();
            v.TimeRules = _mapper.Map<List<VoucherTimeRule>>(validTimeRules);
        }
        else
        {
            v.TimeRules = new List<VoucherTimeRule>();
        }

        // Map UserRules - only keep valid rules
        if (request.UserRules != null)
        {
            var validUserRules = request
                .UserRules.Where(ur =>
                    (ur.SpecificCustomerIds != null && ur.SpecificCustomerIds.Any())
                    || ur.MembershipId.HasValue
                    || ur.IsNewCustomer.HasValue
                )
                .ToList();
            v.UserRules = _mapper.Map<List<VoucherUserRule>>(validUserRules);
        }
        else
        {
            v.UserRules = new List<VoucherUserRule>();
        }

        _context.Vouchers.Update(v);
        await _context.SaveChangesAsync();
    }

    public async Task<List<VoucherResponse>> GetAvailableVouchersForCurrentUserAsync(
        GetAvailableVouchersRequest request
    )
    {
        _logger.LogInformation(
            "GetAvailableVouchers - Request: CustomerId={CustomerId}, BookingDateTime={BookingDateTime}",
            request.CustomerId,
            request.BookingDateTime
        );

        // Determine which customer to use
        Customer? customer;

        if (request.CustomerId.HasValue)
        {
            // Staff is checking vouchers for a specific customer
            customer = await _context.Customers.FindAsync(request.CustomerId.Value);
            if (customer == null)
            {
                throw new ApiException("Khách hàng không tồn tại", HttpStatusCode.BadRequest);
            }
        }
        else
        {
            // User is checking their own vouchers
            var userId = _currentUser.UserId;
            if (userId == null)
            {
                throw new ApiException("Người dùng chưa đăng nhập", HttpStatusCode.Unauthorized);
            }

            customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null)
            {
                throw new ApiException(
                    "Không tìm thấy thông tin khách hàng",
                    HttpStatusCode.BadRequest
                );
            }
        }

        // Use provided booking time or default to current UTC time
        var referenceTime = request.BookingDateTime ?? DateTime.UtcNow;
        var currentDate = DateOnly.FromDateTime(referenceTime);
        var currentTime = TimeOnly.FromDateTime(referenceTime);
        var currentDayOfWeek = referenceTime.DayOfWeek;

        // Parse end time if provided (for time range check)
        TimeOnly? endTime = null;
        if (request.EndTime.HasValue)
        {
            endTime = TimeOnly.FromDateTime(request.EndTime.Value);
        }

        // Step 1: Get all active vouchers within date range (base filter)
        // This checks: IsActive, StartAt, EndAt, total usage limit, and MinOrderValue
        var vouchers = await _context
            .Vouchers.Include(v => v.TimeRules)
            .Include(v => v.UserRules)
            .Where(v =>
                v.IsActive // Check voucher is active
                && v.StartAt <= referenceTime // Check start date
                && v.EndAt >= referenceTime // Check end date
                && (v.UsageLimitTotal == 0 || v.UsedCount < v.UsageLimitTotal) // Check total usage limit
                && (
                    !v.MinOrderValue.HasValue
                    || !request.OriginalAmount.HasValue
                    || request.OriginalAmount.Value >= v.MinOrderValue.Value
                ) // Check min order value if provided
            )
            .ToListAsync();

        _logger.LogInformation(
            "Step 1: Found {Count} vouchers after base filter (active, date range, total usage)",
            vouchers.Count
        );

        // Step 2: Pre-load voucher usages for this specific customer to avoid N+1 queries
        var voucherIds = vouchers.Select(v => v.Id).ToList();
        var userVoucherUsages = await _context
            .VoucherUsages.Where(vu =>
                vu.CustomerId == customer.Id && voucherIds.Contains(vu.VoucherId)
            )
            .GroupBy(vu => vu.VoucherId)
            .Select(g => new { VoucherId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.VoucherId, x => x.Count);

        // Step 3: Check if customer is new (has no orders)
        var isNewCustomer = !await _context.Orders.AnyAsync(o => o.CustomerId == customer.Id);

        _logger.LogInformation(
            "Step 3: Customer {CustomerId} is new customer: {IsNew}",
            customer.Id,
            isNewCustomer
        );

        var availableVouchers = new List<Voucher>();

        foreach (var voucher in vouchers)
        {
            _logger.LogInformation(
                "Checking voucher {VoucherCode} (ID: {VoucherId})",
                voucher.Code,
                voucher.Id
            );

            // Step 4: Check usage limit per user (user-specific check)
            var userUsageCount = userVoucherUsages.GetValueOrDefault(voucher.Id, 0);

            if (voucher.UsageLimitPerUser > 0 && userUsageCount >= voucher.UsageLimitPerUser)
            {
                _logger.LogInformation(
                    "  ❌ Failed Step 4: User usage limit reached ({Used}/{Limit})",
                    userUsageCount,
                    voucher.UsageLimitPerUser
                );
                continue; // This specific user has reached their usage limit
            }

            // Step 5: Check time rules (time-specific check - different for each request time)
            // If voucher has time rules, it must match at least one rule
            // If no time rules (or all rules are empty), voucher is available at any time (within StartAt/EndAt)
            var validTimeRules = voucher
                .TimeRules?.Where(tr => tr.SpecificDate.HasValue || tr.DayOfWeek.HasValue)
                .ToList();
            if (validTimeRules != null && validTimeRules.Any())
            {
                _logger.LogInformation(
                    "  Checking {Count} valid time rules (out of {Total} total)",
                    validTimeRules.Count,
                    voucher.TimeRules?.Count ?? 0
                );
                var matchesTimeRule = false;
                foreach (var timeRule in validTimeRules)
                {
                    // Check specific date rule
                    if (timeRule.SpecificDate.HasValue)
                    {
                        var specificDate = DateOnly.FromDateTime(timeRule.SpecificDate.Value);
                        _logger.LogInformation(
                            "    Time rule: SpecificDate={Date}, Current={Current}",
                            specificDate,
                            currentDate
                        );
                        if (currentDate == specificDate)
                        {
                            // If specific date matches, check time range if specified
                            if (timeRule.StartTime.HasValue && timeRule.EndTime.HasValue)
                            {
                                var ts = timeRule.StartTime.Value;
                                var te = timeRule.EndTime.Value;
                                var ruleStartTime = new TimeOnly(ts.Hours, ts.Minutes, ts.Seconds);
                                var ruleEndTime = new TimeOnly(te.Hours, te.Minutes, te.Seconds);

                                // Check if booking time range overlaps with rule time range
                                if (endTime.HasValue)
                                {
                                    // Booking has both start and end time - check overlap
                                    if (currentTime < ruleEndTime && endTime.Value > ruleStartTime)
                                    {
                                        matchesTimeRule = true;
                                        break; // Matches this time rule
                                    }
                                }
                                else
                                {
                                    // Only start time - check if within range
                                    if (currentTime >= ruleStartTime && currentTime <= ruleEndTime)
                                    {
                                        matchesTimeRule = true;
                                        break; // Matches this time rule
                                    }
                                }
                            }
                            else
                            {
                                // Specific date matches and no time restriction
                                matchesTimeRule = true;
                                break;
                            }
                        }
                    }
                    // Check day of week rule (only if no specific date)
                    else if (timeRule.DayOfWeek.HasValue)
                    {
                        _logger.LogInformation(
                            "    Time rule: DayOfWeek={DoW}, Current={Current}",
                            timeRule.DayOfWeek.Value,
                            currentDayOfWeek
                        );
                        if (currentDayOfWeek == timeRule.DayOfWeek.Value)
                        {
                            // Check time range if specified
                            if (timeRule.StartTime.HasValue && timeRule.EndTime.HasValue)
                            {
                                var ts = timeRule.StartTime.Value;
                                var te = timeRule.EndTime.Value;
                                var ruleStartTime = new TimeOnly(ts.Hours, ts.Minutes, ts.Seconds);
                                var ruleEndTime = new TimeOnly(te.Hours, te.Minutes, te.Seconds);

                                // Check if booking time range overlaps with rule time range
                                if (endTime.HasValue)
                                {
                                    // Booking has both start and end time - check overlap
                                    if (currentTime < ruleEndTime && endTime.Value > ruleStartTime)
                                    {
                                        matchesTimeRule = true;
                                        break; // Matches this time rule
                                    }
                                }
                                else
                                {
                                    // Only start time - check if within range
                                    if (currentTime >= ruleStartTime && currentTime <= ruleEndTime)
                                    {
                                        matchesTimeRule = true;
                                        break; // Matches this time rule
                                    }
                                }
                            }
                            else
                            {
                                // Day of week matches and no time restriction
                                matchesTimeRule = true;
                                break;
                            }
                        }
                    }
                }

                if (!matchesTimeRule)
                {
                    _logger.LogInformation("  ❌ Failed Step 5: No time rule matched");
                    continue; // Doesn't match any time rule for current time
                }
            }

            // Step 6: Check user/customer rules (user-specific check)
            // If voucher has user rules, it must match at least one rule
            // If no user rules (or all rules are empty), voucher is available to all users
            var validUserRules = voucher
                .UserRules?.Where(ur =>
                    (ur.SpecificCustomerIds != null && ur.SpecificCustomerIds.Any())
                    || ur.MembershipId.HasValue
                    || ur.IsNewCustomer.HasValue
                )
                .ToList();

            if (validUserRules != null && validUserRules.Any())
            {
                _logger.LogInformation(
                    "  Checking {Count} valid user rules (out of {Total} total)",
                    validUserRules.Count,
                    voucher.UserRules?.Count ?? 0
                );
                var matchesUserRule = false;

                foreach (var userRule in validUserRules)
                {
                    // Check specific customer IDs first (highest priority)
                    if (userRule.SpecificCustomerIds != null && userRule.SpecificCustomerIds.Any())
                    {
                        _logger.LogInformation(
                            "    User rule: SpecificCustomerIds={Ids}, Current={Current}",
                            string.Join(",", userRule.SpecificCustomerIds),
                            customer.Id
                        );
                        if (userRule.SpecificCustomerIds.Contains(customer.Id))
                        {
                            matchesUserRule = true;
                            break; // Matches this user rule
                        }
                        continue; // Don't check other rules if SpecificCustomerIds is set
                    }

                    // Check membership (second priority)
                    if (userRule.MembershipId.HasValue)
                    {
                        var hasActiveMembership = await _context.UserMemberships.AnyAsync(um =>
                            um.CustomerId == customer.Id
                            && um.MembershipId == userRule.MembershipId.Value
                            && um.IsActive
                        );
                        _logger.LogInformation(
                            "    User rule: MembershipId={MembershipId}, HasActive={HasActive}",
                            userRule.MembershipId.Value,
                            hasActiveMembership
                        );
                        if (hasActiveMembership)
                        {
                            matchesUserRule = true;
                            break; // Matches this user rule
                        }
                        continue;
                    }

                    // Check new customer (third priority)
                    if (userRule.IsNewCustomer.HasValue)
                    {
                        _logger.LogInformation(
                            "    User rule: IsNewCustomer={Required}, Actual={Actual}",
                            userRule.IsNewCustomer.Value,
                            isNewCustomer
                        );
                        if (userRule.IsNewCustomer.Value == isNewCustomer)
                        {
                            matchesUserRule = true;
                            break; // Matches this user rule
                        }
                        continue;
                    }
                }

                if (!matchesUserRule)
                {
                    _logger.LogInformation("  ❌ Failed Step 6: No user rule matched");
                    continue; // This specific user doesn't match any user rule
                }
            }

            // All checks passed: voucher is available for this user at this time
            _logger.LogInformation("  ✅ Voucher {Code} passed all checks", voucher.Code);
            availableVouchers.Add(voucher);
        }

        _logger.LogInformation("Final result: {Count} vouchers available", availableVouchers.Count);
        return _mapper.Map<List<VoucherResponse>>(availableVouchers);
    }

    /// <summary>
    /// Creates a customer record for the given user if it doesn't exist.
    /// This ensures consistency across voucher operations (available, validate, booking).
    /// </summary>
    private async Task EnsureCustomerExistsForUserAsync(ApplicationUser user)
    {
        if (user.Customer != null)
        {
            return;
        }

        var customer = new Customer
        {
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber ?? "",
            Email = user.Email ?? "",
            Status = CustomerStatus.Active,
            UserId = user.Id,
        };

        await _context.Customers.AddAsync(customer);
        user.Customer = customer;
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
    }

    public async Task<ValidateVoucherResponse> ValidateAndCalculateDiscountAsync(
        ValidateVoucherRequest request,
        int customerId
    )
    {
        // Get voucher
        var voucher = await _context
            .Vouchers.Include(v => v.TimeRules)
            .Include(v => v.UserRules)
            .FirstOrDefaultAsync(v => v.Id == request.VoucherId);

        if (voucher == null)
        {
            return new ValidateVoucherResponse
            {
                IsValid = false,
                ErrorMessage = "Voucher không tồn tại",
            };
        }

        // Check if voucher is active
        if (!voucher.IsActive)
        {
            return new ValidateVoucherResponse
            {
                IsValid = false,
                ErrorMessage = "Voucher không còn hoạt động",
            };
        }

        // Determine the reference time for validation. If booking context is provided in the request,
        // use that; otherwise fall back to current UTC time.
        var referenceDateTime = DateTime.UtcNow;
        if (request.BookingDate.HasValue)
        {
            // Build a DateTime from BookingDate and optional start time if present
            var bookingDate = request.BookingDate.Value.Date;
            if (request.BookingStartTime.HasValue)
            {
                var st = request.BookingStartTime.Value;
                referenceDateTime = new DateTime(
                    bookingDate.Year,
                    bookingDate.Month,
                    bookingDate.Day,
                    st.Hour,
                    st.Minute,
                    st.Second,
                    DateTimeKind.Utc
                );
            }
            else
            {
                referenceDateTime = bookingDate;
            }
        }

        // Check date range against referenceDateTime
        if (voucher.StartAt > referenceDateTime)
        {
            return new ValidateVoucherResponse
            {
                IsValid = false,
                ErrorMessage =
                    $"Voucher chưa đến thời gian sử dụng. Có hiệu lực từ {voucher.StartAt:dd/MM/yyyy HH:mm}",
            };
        }

        if (voucher.EndAt < referenceDateTime)
        {
            return new ValidateVoucherResponse
            {
                IsValid = false,
                ErrorMessage = $"Voucher đã hết hạn sử dụng vào {voucher.EndAt:dd/MM/yyyy HH:mm}",
            };
        }

        // Check total usage limit
        if (voucher.UsageLimitTotal > 0 && voucher.UsedCount >= voucher.UsageLimitTotal)
        {
            return new ValidateVoucherResponse
            {
                IsValid = false,
                ErrorMessage =
                    $"Voucher đã hết lượt sử dụng ({voucher.UsedCount}/{voucher.UsageLimitTotal})",
            };
        }

        // Check per-user usage limit
        var userUsageCount = await _context.VoucherUsages.CountAsync(vu =>
            vu.VoucherId == voucher.Id && vu.CustomerId == customerId
        );

        if (voucher.UsageLimitPerUser > 0 && userUsageCount >= voucher.UsageLimitPerUser)
        {
            return new ValidateVoucherResponse
            {
                IsValid = false,
                ErrorMessage =
                    $"Bạn đã sử dụng hết lượt voucher này ({userUsageCount}/{voucher.UsageLimitPerUser})",
            };
        }

        // Check minimum order value
        if (
            voucher.MinOrderValue.HasValue
            && request.OrderTotalAmount < voucher.MinOrderValue.Value
        )
        {
            return new ValidateVoucherResponse
            {
                IsValid = false,
                ErrorMessage =
                    $"Đơn hàng phải có giá trị tối thiểu {voucher.MinOrderValue.Value:N0} VNĐ",
            };
        }

        // Check time rules - use booking context if provided, otherwise current UTC
        var currentDate = DateOnly.FromDateTime(referenceDateTime);
        var currentTime = TimeOnly.FromDateTime(referenceDateTime);
        var currentDayOfWeek = referenceDateTime.DayOfWeek;

        if (voucher.TimeRules != null && voucher.TimeRules.Any())
        {
            var matchesTimeRule = false;
            foreach (var timeRule in voucher.TimeRules)
            {
                if (timeRule.SpecificDate.HasValue)
                {
                    var specificDate = DateOnly.FromDateTime(timeRule.SpecificDate.Value);
                    if (currentDate == specificDate)
                    {
                        if (timeRule.StartTime.HasValue && timeRule.EndTime.HasValue)
                        {
                            var ts = timeRule.StartTime.Value;
                            var te = timeRule.EndTime.Value;
                            var startTime = new TimeOnly(ts.Hours, ts.Minutes, ts.Seconds);
                            var endTime = new TimeOnly(te.Hours, te.Minutes, te.Seconds);
                            if (currentTime >= startTime && currentTime <= endTime)
                            {
                                matchesTimeRule = true;
                                break;
                            }
                        }
                        else
                        {
                            matchesTimeRule = true;
                            break;
                        }
                    }
                }
                else if (timeRule.DayOfWeek.HasValue)
                {
                    if (currentDayOfWeek == timeRule.DayOfWeek.Value)
                    {
                        if (timeRule.StartTime.HasValue && timeRule.EndTime.HasValue)
                        {
                            var ts = timeRule.StartTime.Value;
                            var te = timeRule.EndTime.Value;
                            var startTime = new TimeOnly(ts.Hours, ts.Minutes, ts.Seconds);
                            var endTime = new TimeOnly(te.Hours, te.Minutes, te.Seconds);
                            if (currentTime >= startTime && currentTime <= endTime)
                            {
                                matchesTimeRule = true;
                                break;
                            }
                        }
                        else
                        {
                            matchesTimeRule = true;
                            break;
                        }
                    }
                }
            }

            if (!matchesTimeRule)
            {
                return new ValidateVoucherResponse
                {
                    IsValid = false,
                    ErrorMessage = "Voucher không khả dụng tại thời điểm này",
                };
            }
        }

        // Check user rules
        var customer = await _context.Customers.FindAsync(customerId);
        if (customer == null)
        {
            return new ValidateVoucherResponse
            {
                IsValid = false,
                ErrorMessage = "Không tìm thấy thông tin khách hàng",
            };
        }

        if (voucher.UserRules != null && voucher.UserRules.Any())
        {
            var isNewCustomer = !await _context.Orders.AnyAsync(o => o.CustomerId == customerId);
            var matchesUserRule = false;

            foreach (var userRule in voucher.UserRules)
            {
                // Check specific customer IDs first (highest priority)
                if (userRule.SpecificCustomerIds != null && userRule.SpecificCustomerIds.Any())
                {
                    if (userRule.SpecificCustomerIds.Contains(customerId))
                    {
                        matchesUserRule = true;
                        break;
                    }
                    continue; // Don't check other rules if SpecificCustomerIds is set
                }

                // Check membership
                if (userRule.MembershipId.HasValue)
                {
                    var hasActiveMembership = await _context.UserMemberships.AnyAsync(um =>
                        um.CustomerId == customerId
                        && um.MembershipId == userRule.MembershipId.Value
                        && um.IsActive
                    );
                    if (hasActiveMembership)
                    {
                        matchesUserRule = true;
                        break;
                    }
                    continue;
                }

                // Check new customer
                if (userRule.IsNewCustomer.HasValue)
                {
                    if (userRule.IsNewCustomer.Value == isNewCustomer)
                    {
                        matchesUserRule = true;
                        break;
                    }
                    continue;
                }

                // If no specific rule, consider it as matching (voucher available to all)
                matchesUserRule = true;
                break;
            }

            if (!matchesUserRule)
            {
                // Build detailed error message based on user rules
                var errorDetails = new List<string>();
                foreach (var userRule in voucher.UserRules)
                {
                    if (userRule.SpecificCustomerIds != null && userRule.SpecificCustomerIds.Any())
                    {
                        errorDetails.Add("chỉ dành cho khách hàng được chỉ định");
                    }
                    else if (userRule.MembershipId.HasValue)
                    {
                        var membership = await _context.Memberships.FindAsync(
                            userRule.MembershipId.Value
                        );
                        errorDetails.Add(
                            $"yêu cầu gói thành viên {membership?.Name ?? "đặc biệt"}"
                        );
                    }
                    else if (userRule.IsNewCustomer.HasValue)
                    {
                        errorDetails.Add(
                            userRule.IsNewCustomer.Value
                                ? "chỉ dành cho khách hàng mới"
                                : "chỉ dành cho khách hàng cũ"
                        );
                    }
                }

                var errorMessage = errorDetails.Any()
                    ? $"Voucher {string.Join(" hoặc ", errorDetails)}"
                    : "Bạn không đủ điều kiện sử dụng voucher này";

                return new ValidateVoucherResponse { IsValid = false, ErrorMessage = errorMessage };
            }
        }

        // Calculate discount amount
        decimal discountAmount = 0;

        if (voucher.DiscountType == "percentage" && voucher.DiscountPercentage.HasValue)
        {
            // Percentage discount
            discountAmount = request.OrderTotalAmount * voucher.DiscountPercentage.Value / 100;

            // Apply max discount if specified
            if (
                voucher.MaxDiscountValue.HasValue
                && discountAmount > voucher.MaxDiscountValue.Value
            )
            {
                discountAmount = voucher.MaxDiscountValue.Value;
            }
        }
        else if (voucher.DiscountType == "fixed")
        {
            // Fixed amount discount
            discountAmount = voucher.DiscountValue;

            // Don't exceed order total
            if (discountAmount > request.OrderTotalAmount)
            {
                discountAmount = request.OrderTotalAmount;
            }
        }

        var finalAmount = Math.Max(0, request.OrderTotalAmount - discountAmount);

        return new ValidateVoucherResponse
        {
            IsValid = true,
            DiscountAmount = discountAmount,
            FinalAmount = finalAmount,
            Voucher = _mapper.Map<VoucherResponse>(voucher),
        };
    }

    public async Task RecordVoucherUsageAsync(
        int voucherId,
        int customerId,
        Guid orderId,
        decimal discountAmount
    )
    {
        // Use database transaction
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // PESSIMISTIC LOCK
            var voucher = await _context
                .Vouchers.FromSqlRaw(
                    "SELECT * FROM \"Vouchers\" WHERE \"Id\" = {0} FOR UPDATE",
                    voucherId
                )
                .FirstOrDefaultAsync();

            if (voucher == null)
            {
                throw new ApiException("Voucher không tồn tại", HttpStatusCode.NotFound);
            }

            //  Double-check usage limits after acquiring lock

            if (voucher.UsageLimitTotal > 0 && voucher.UsedCount >= voucher.UsageLimitTotal)
            {
                throw new ApiException(
                    $"Voucher đã hết lượt sử dụng ({voucher.UsedCount}/{voucher.UsageLimitTotal})",
                    HttpStatusCode.BadRequest
                );
            }

            // Check per-user usage limit
            var userUsageCount = await _context.VoucherUsages.CountAsync(vu =>
                vu.VoucherId == voucherId && vu.CustomerId == customerId
            );

            if (voucher.UsageLimitPerUser > 0 && userUsageCount >= voucher.UsageLimitPerUser)
            {
                throw new ApiException(
                    $"Bạn đã sử dụng hết lượt voucher này ({userUsageCount}/{voucher.UsageLimitPerUser})",
                    HttpStatusCode.BadRequest
                );
            }

            // All checks passed - create usage record and increment counter
            var voucherUsage = new VoucherUsage
            {
                VoucherId = voucherId,
                CustomerId = customerId,
                DiscountApplied = discountAmount,
                UsedAt = DateTime.UtcNow,
            };

            _context.VoucherUsages.Add(voucherUsage);
            voucher.UsedCount += 1;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task ExtendAsync(int id, ExtendVoucherRequest request)
    {
        var v = await _context.Vouchers.FindAsync(id);
        if (v == null)
            throw new ApiException("Voucher không tồn tại", HttpStatusCode.NotFound);

        // Chỉ update những trường có giá trị (partial update)
        if (request.EndAt.HasValue)
        {
            v.EndAt = request.EndAt.Value;
        }

        if (request.UsageLimitTotal.HasValue)
        {
            v.UsageLimitTotal = request.UsageLimitTotal.Value;
        }

        if (request.UsageLimitPerUser.HasValue)
        {
            v.UsageLimitPerUser = request.UsageLimitPerUser.Value;
        }

        _context.Vouchers.Update(v);
        await _context.SaveChangesAsync();
    }
}

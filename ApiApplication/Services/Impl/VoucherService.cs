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

    public VoucherService(ApplicationDbContext context, IMapper mapper, ICurrentUser currentUser)
    {
        _context = context;
        _mapper = mapper;
        _currentUser = currentUser;
    }

    public async Task<int> CreateAsync(CreateVoucherRequest request)
    {
        // basic validation
        if (string.IsNullOrWhiteSpace(request.Code))
            throw new ApiException("Mã voucher không được để trống", HttpStatusCode.BadRequest);

        var exists = await _context.Vouchers.AnyAsync(v => v.Code == request.Code);
        if (exists)
            throw new ApiException("Mã voucher đã tồn tại", HttpStatusCode.BadRequest);

        // Map request to entity using AutoMapper
        var entity = _mapper.Map<Voucher>(request);
        entity.TimeRules = new List<VoucherTimeRule>();
        entity.UserRules = new List<VoucherUserRule>();

        // Map TimeRules
        if (request.TimeRules != null)
        {
            entity.TimeRules = _mapper.Map<List<VoucherTimeRule>>(request.TimeRules);
        }

        // Map UserRules
        if (request.UserRules != null)
        {
            entity.UserRules = _mapper.Map<List<VoucherUserRule>>(request.UserRules);
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
        
        // Chỉ cho phép xóa voucher chưa được sử dụng lần nào
        if (v.UsedCount > 0)
        {
            throw new ApiException(
                $"Không thể xóa voucher này. Voucher đã được sử dụng {v.UsedCount} lần.",
                HttpStatusCode.BadRequest
            );
        }
        
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

        // Update fields using AutoMapper
        _mapper.Map(request, v);

        // Replace rules
        _context.VoucherTimeRules.RemoveRange(v.TimeRules ?? Enumerable.Empty<VoucherTimeRule>());
        _context.VoucherUserRules.RemoveRange(v.UserRules ?? Enumerable.Empty<VoucherUserRule>());

        // Map TimeRules
        if (request.TimeRules != null)
        {
            v.TimeRules = _mapper.Map<List<VoucherTimeRule>>(request.TimeRules);
        }
        else
        {
            v.TimeRules = new List<VoucherTimeRule>();
        }

        // Map UserRules
        if (request.UserRules != null)
        {
            v.UserRules = _mapper.Map<List<VoucherUserRule>>(request.UserRules);
        }
        else
        {
            v.UserRules = new List<VoucherUserRule>();
        }

        _context.Vouchers.Update(v);
        await _context.SaveChangesAsync();
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

    public async Task<List<VoucherResponse>> GetAvailableVouchersForCurrentUserAsync()
    {
        // Get current user
        var userId = _currentUser.UserId;
        if (userId == null)
        {
            throw new ApiException("Người dùng chưa đăng nhập", HttpStatusCode.Unauthorized);
        }

        // Get user with customer navigation property
        var user = await _context
            .Users.Include(u => u.Customer)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            throw new ApiException("Người dùng không tồn tại", HttpStatusCode.Unauthorized);
        }

        if (user.Customer == null)
        {
            throw new ApiException(
                "Vui lòng xác nhận email để tạo tài khoản khách hàng trước khi sử dụng voucher.",
                HttpStatusCode.BadRequest
            );
        }

        var customer = user.Customer;

        // Get current time information (this will be different for each request)
        var now = DateTime.UtcNow;
        var currentDate = DateOnly.FromDateTime(now);
        var currentTime = TimeOnly.FromDateTime(now);
        var currentDayOfWeek = now.DayOfWeek;

        // Step 1: Get all active vouchers within date range (base filter)
        // This checks: IsActive, StartAt, EndAt, and total usage limit
        var vouchers = await _context
            .Vouchers.Include(v => v.TimeRules)
            .Include(v => v.UserRules)
            .Where(v =>
                v.IsActive // Check voucher is active
                && v.StartAt <= now // Check start date
                && v.EndAt >= now // Check end date
                && (v.UsageLimitTotal == 0 || v.UsedCount < v.UsageLimitTotal) // Check total usage limit
            )
            .ToListAsync();

        // If there's still no customer (e.g. admin/receptionist accounts that shouldn't have customers),
        // return all active, non-expired vouchers so staff can apply them when creating bookings for customers.
        if (customer == null)
        {
            return _mapper.Map<List<VoucherResponse>>(vouchers);
        }

        // Step 2: Pre-load voucher usages for this specific customer to avoid N+1 queries
        // This is user-specific, so different users will have different usage counts
        var voucherIds = vouchers.Select(v => v.Id).ToList();
        var userVoucherUsages = await _context
            .VoucherUsages.Where(vu =>
                vu.CustomerId == customer.Id && voucherIds.Contains(vu.VoucherId)
            )
            .GroupBy(vu => vu.VoucherId)
            .Select(g => new { VoucherId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.VoucherId, x => x.Count);

        // Step 3: Check if customer is new (has no orders) - this is user-specific
        var isNewCustomer = !await _context.Orders.AnyAsync(o => o.CustomerId == customer.Id);

        var availableVouchers = new List<Voucher>();

        foreach (var voucher in vouchers)
        {
            // Step 4: Check usage limit per user (user-specific check)
            var userUsageCount = userVoucherUsages.GetValueOrDefault(voucher.Id, 0);

            if (voucher.UsageLimitPerUser > 0 && userUsageCount >= voucher.UsageLimitPerUser)
            {
                continue; // This specific user has reached their usage limit
            }

            // Step 5: Check time rules (time-specific check - different for each request time)
            // If voucher has time rules, it must match at least one rule
            // If no time rules, voucher is available at any time (within StartAt/EndAt)
            if (voucher.TimeRules != null && voucher.TimeRules.Any())
            {
                var matchesTimeRule = false;
                foreach (var timeRule in voucher.TimeRules)
                {
                    // Check specific date rule
                    if (timeRule.SpecificDate.HasValue)
                    {
                        var specificDate = DateOnly.FromDateTime(timeRule.SpecificDate.Value);
                        if (currentDate == specificDate)
                        {
                            // If specific date matches, check time range if specified
                            if (timeRule.StartTime.HasValue && timeRule.EndTime.HasValue)
                            {
                                var ts = timeRule.StartTime.Value;
                                var te = timeRule.EndTime.Value;
                                var startTime = new TimeOnly(ts.Hours, ts.Minutes, ts.Seconds);
                                var endTime = new TimeOnly(te.Hours, te.Minutes, te.Seconds);
                                if (currentTime >= startTime && currentTime <= endTime)
                                {
                                    matchesTimeRule = true;
                                    break; // Matches this time rule
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
                        if (currentDayOfWeek == timeRule.DayOfWeek.Value)
                        {
                            // Check time range if specified
                            if (timeRule.StartTime.HasValue && timeRule.EndTime.HasValue)
                            {
                                var ts = timeRule.StartTime.Value;
                                var te = timeRule.EndTime.Value;
                                var startTime = new TimeOnly(ts.Hours, ts.Minutes, ts.Seconds);
                                var endTime = new TimeOnly(te.Hours, te.Minutes, te.Seconds);
                                if (currentTime >= startTime && currentTime <= endTime)
                                {
                                    matchesTimeRule = true;
                                    break; // Matches this time rule
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
                    continue; // Doesn't match any time rule for current time
                }
            }

            // Step 6: Check user/customer rules (user-specific check)
            // If voucher has user rules, it must match at least one rule
            // If no user rules, voucher is available to all users
            if (voucher.UserRules != null && voucher.UserRules.Any())
            {
                var matchesUserRule = false;

                foreach (var userRule in voucher.UserRules)
                {
                    // Check if new customer rule matches
                    if (userRule.IsNewCustomer.HasValue)
                    {
                        if (userRule.IsNewCustomer.Value == isNewCustomer)
                        {
                            matchesUserRule = true;
                            break; // Matches this user rule
                        }
                    }
                    // If no specific rule, consider it as matching (voucher available to all)
                    else if (string.IsNullOrWhiteSpace(userRule.UserType))
                    {
                        matchesUserRule = true;
                        break;
                    }
                    // TODO: Add more user type checks if needed (e.g., membership level, etc.)
                }

                if (!matchesUserRule)
                {
                    continue; // This specific user doesn't match any user rule
                }
            }

            // All checks passed: voucher is available for this user at this time
            availableVouchers.Add(voucher);
        }

        return _mapper.Map<List<VoucherResponse>>(availableVouchers);
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
                ErrorMessage = $"Voucher chưa đến thời gian sử dụng. Voucher có hiệu lực từ {voucher.StartAt:dd/MM/yyyy HH:mm}",
            };
        }
        if (voucher.EndAt < referenceDateTime)
        {
            return new ValidateVoucherResponse
            {
                IsValid = false,
                ErrorMessage = $"Voucher đã hết hạn. Voucher có hiệu lực đến {voucher.EndAt:dd/MM/yyyy HH:mm}",
            };
        }

        // Check total usage limit
        if (voucher.UsageLimitTotal > 0 && voucher.UsedCount >= voucher.UsageLimitTotal)
        {
            return new ValidateVoucherResponse
            {
                IsValid = false,
                ErrorMessage = "Voucher đã hết lượt sử dụng",
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
                ErrorMessage = "Bạn đã sử dụng hết lượt voucher này",
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
            string? timeRuleError = null; // Ưu tiên hiển thị lỗi về giờ nếu đúng ngày/thứ
            string? dateRuleError = null; // Lỗi về ngày/thứ nếu sai hoàn toàn
            var dayNames = new Dictionary<DayOfWeek, string>
            {
                { DayOfWeek.Monday, "Thứ 2" },
                { DayOfWeek.Tuesday, "Thứ 3" },
                { DayOfWeek.Wednesday, "Thứ 4" },
                { DayOfWeek.Thursday, "Thứ 5" },
                { DayOfWeek.Friday, "Thứ 6" },
                { DayOfWeek.Saturday, "Thứ 7" },
                { DayOfWeek.Sunday, "Chủ nhật" },
            };

            foreach (var timeRule in voucher.TimeRules)
            {
                if (timeRule.SpecificDate.HasValue)
                {
                    var specificDate = DateOnly.FromDateTime(timeRule.SpecificDate.Value);
                    if (currentDate == specificDate)
                    {
                        // Đúng ngày
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
                            else
                            {
                                // Đúng ngày nhưng sai giờ - đây là lỗi quan trọng nhất
                                timeRuleError = $"Voucher chỉ áp dụng vào ngày {specificDate:dd/MM/yyyy} từ {startTime:HH:mm} đến {endTime:HH:mm}. Hiện tại là {currentTime:HH:mm}";
                            }
                        }
                        else
                        {
                            // Đúng ngày, không có giờ cụ thể -> hợp lệ
                            matchesTimeRule = true;
                            break;
                        }
                    }
                    else
                    {
                        // Sai ngày - chỉ lưu nếu chưa có lỗi về giờ
                        if (string.IsNullOrEmpty(timeRuleError))
                        {
                            if (timeRule.StartTime.HasValue && timeRule.EndTime.HasValue)
                            {
                                var ts = timeRule.StartTime.Value;
                                var te = timeRule.EndTime.Value;
                                var startTime = new TimeOnly(ts.Hours, ts.Minutes, ts.Seconds);
                                var endTime = new TimeOnly(te.Hours, te.Minutes, te.Seconds);
                                dateRuleError = $"Voucher chỉ áp dụng vào ngày {specificDate:dd/MM/yyyy} từ {startTime:HH:mm} đến {endTime:HH:mm}";
                            }
                            else
                            {
                                dateRuleError = $"Voucher chỉ áp dụng vào ngày {specificDate:dd/MM/yyyy}";
                            }
                        }
                    }
                }
                else if (timeRule.DayOfWeek.HasValue)
                {
                    var ruleDayOfWeek = (DayOfWeek)timeRule.DayOfWeek.Value;
                    if (currentDayOfWeek == ruleDayOfWeek)
                    {
                        // Đúng thứ
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
                            else
                            {
                                // Đúng thứ nhưng sai giờ - đây là lỗi quan trọng nhất
                                timeRuleError = $"Voucher chỉ áp dụng vào {dayNames[ruleDayOfWeek]} từ {startTime:HH:mm} đến {endTime:HH:mm}. Hiện tại là {currentTime:HH:mm}";
                            }
                        }
                        else
                        {
                            // Đúng thứ, không có giờ cụ thể -> hợp lệ
                            matchesTimeRule = true;
                            break;
                        }
                    }
                    else
                    {
                        // Sai thứ - chỉ lưu nếu chưa có lỗi về giờ
                        if (string.IsNullOrEmpty(timeRuleError))
                        {
                            if (timeRule.StartTime.HasValue && timeRule.EndTime.HasValue)
                            {
                                var ts = timeRule.StartTime.Value;
                                var te = timeRule.EndTime.Value;
                                var startTime = new TimeOnly(ts.Hours, ts.Minutes, ts.Seconds);
                                var endTime = new TimeOnly(te.Hours, te.Minutes, te.Seconds);
                                dateRuleError = $"Voucher chỉ áp dụng vào {dayNames[ruleDayOfWeek]} từ {startTime:HH:mm} đến {endTime:HH:mm}";
                            }
                            else
                            {
                                dateRuleError = $"Voucher chỉ áp dụng vào {dayNames[ruleDayOfWeek]}";
                            }
                        }
                    }
                }
            }

            if (!matchesTimeRule)
            {
                // Ưu tiên hiển thị lỗi về giờ (nếu đúng ngày/thứ nhưng sai giờ)
                // Nếu không có, hiển thị lỗi về ngày/thứ
                var errorMessage = !string.IsNullOrEmpty(timeRuleError)
                    ? timeRuleError
                    : (!string.IsNullOrEmpty(dateRuleError)
                        ? dateRuleError
                        : "Voucher không khả dụng tại thời điểm này. Vui lòng kiểm tra điều kiện thời gian sử dụng.");

                return new ValidateVoucherResponse
                {
                    IsValid = false,
                    ErrorMessage = errorMessage,
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
            string? userRuleDescription = null;

            foreach (var userRule in voucher.UserRules)
            {
                if (userRule.IsNewCustomer.HasValue)
                {
                    if (userRule.IsNewCustomer.Value == isNewCustomer)
                    {
                        matchesUserRule = true;
                        break;
                    }
                    else
                    {
                        userRuleDescription = userRule.IsNewCustomer.Value
                            ? "Voucher này chỉ dành cho khách hàng mới (chưa từng đặt hàng)"
                            : "Voucher này chỉ dành cho khách hàng đã từng đặt hàng";
                    }
                }
                else if (string.IsNullOrWhiteSpace(userRule.UserType))
                {
                    matchesUserRule = true;
                    break;
                }
            }

            if (!matchesUserRule)
            {
                return new ValidateVoucherResponse
                {
                    IsValid = false,
                    ErrorMessage = userRuleDescription ?? "Bạn không đủ điều kiện sử dụng voucher này. Vui lòng kiểm tra điều kiện áp dụng.",
                };
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
        // Create voucher usage record
        var voucherUsage = new VoucherUsage
        {
            VoucherId = voucherId,
            CustomerId = customerId,
            DiscountApplied = discountAmount,
            UsedAt = DateTime.UtcNow,
        };

        _context.VoucherUsages.Add(voucherUsage);

        // Update voucher used count
        var voucher = await _context.Vouchers.FindAsync(voucherId);
        if (voucher != null)
        {
            voucher.UsedCount += 1;
        }

        await _context.SaveChangesAsync();
    }
}
